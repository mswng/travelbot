from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from vector_store import semantic_search
from database import search_places_by_keyword
from config import OLLAMA_BASE_URL, OLLAMA_MODEL
from typing import List, Dict
import logging
import re
import unicodedata

logger = logging.getLogger(__name__)

llm = ChatOllama(
    base_url=OLLAMA_BASE_URL,
    model=OLLAMA_MODEL,
    temperature=0.2,
    num_predict=900,
)

SYSTEM_PROMPT = """Bạn là TravelBot, trợ lý du lịch dùng dữ liệu địa điểm nội bộ tại Việt Nam.

Quy tắc bắt buộc:
1. Chỉ gợi ý địa điểm xuất hiện trong phần DỮ LIỆU ĐỊA ĐIỂM được cung cấp.
2. Nếu người dùng hỏi một thành phố cụ thể, chỉ được dùng địa điểm thuộc đúng thành phố đó.
3. Không tự tạo tên địa điểm, địa chỉ, số điện thoại, giá hoặc giờ mở cửa.
4. Nếu dữ liệu không có địa điểm phù hợp, nói rõ: "Hiện dữ liệu của mình chưa có địa điểm phù hợp cho yêu cầu này." Sau đó gợi ý người dùng đổi từ khóa hoặc chọn thành phố khác.
5. Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.

Khi gợi ý địa điểm, mỗi mục nên có:
- Tên địa điểm
- Loại địa điểm nếu có
- Địa chỉ
- Rating/giá nếu dữ liệu có
"""

CITY_ALIASES = {
    "ba ria vung tau": "Bà Rịa - Vũng Tàu",
    "can tho": "Cần Thơ",
    "da lat": "Đà Lạt",
    "dalat": "Đà Lạt",
    "da nang": "Đà Nẵng",
    "danang": "Đà Nẵng",
    "ha long": "Hạ Long",
    "halong": "Hạ Long",
    "ha noi": "Hà Nội",
    "hanoi": "Hà Nội",
    "hai phong": "Hải Phòng",
    "ho chi minh": "TP. Hồ Chí Minh",
    "ho chi minh city": "TP. Hồ Chí Minh",
    "hcm": "TP. Hồ Chí Minh",
    "sai gon": "TP. Hồ Chí Minh",
    "saigon": "TP. Hồ Chí Minh",
    "hue": "Huế",
    "nha trang": "Nha Trang",
    "phu quoc": "Phú Quốc",
    "quy nhon": "Quy Nhơn",
    "sa pa": "Sa Pa",
    "sapa": "Sa Pa",
    "vung tau": "Vũng Tàu",
}

TYPE_KEYWORDS = {
    "restaurant": ["nha hang", "quan an", "an uong", "mon an", "do an", "food", "restaurant"],
    "cafe": ["cafe", "ca phe", "coffee"],
    "hotel": ["khach san", "hotel", "homestay", "resort", "luu tru"],
    "park": ["cong vien", "park"],
    "tourist_attraction": ["du lich", "tham quan", "dia diem", "di choi", "attraction", "bao tang", "chua"],
    "bar": ["bar", "pub"],
    "shopping": ["mua sam", "cho", "market", "shopping"],
}


def _normalize(value: object) -> str:
    text = str(value or "").strip().lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    text = re.sub(r"[_\-]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _extract_search_intent(message: str) -> Dict:
    normalized_message = _normalize(message)
    city = None
    place_type = None

    for alias, city_name in CITY_ALIASES.items():
        if alias in normalized_message:
            city = city_name
            break

    for type_name, keywords in TYPE_KEYWORDS.items():
        if any(keyword in normalized_message for keyword in keywords):
            place_type = type_name
            break

    return {
        "city": city,
        "place_type": place_type,
    }


def _place_matches_city(place: Dict, city: str = None) -> bool:
    if not city:
        return True

    expected = _normalize(city).replace("tp ", "").replace("thanh pho ", "")
    place_city = _normalize(place.get("city"))
    address = _normalize(place.get("address"))

    return expected in place_city or expected in address


def _merge_places(*groups: List[Dict]) -> List[Dict]:
    merged = []
    seen_ids = set()

    for group in groups:
        for place in group:
            place_id = str(place.get("id") or place.get("place_id") or place.get("name"))
            if place_id not in seen_ids:
                seen_ids.add(place_id)
                merged.append(place)

    return merged


def _format_places_context(places: List[Dict]) -> str:
    if not places:
        return "DỮ LIỆU ĐỊA ĐIỂM: Không có địa điểm phù hợp."

    lines = ["DỮ LIỆU ĐỊA ĐIỂM ĐƯỢC PHÉP SỬ DỤNG:"]
    for index, place in enumerate(places[:8], 1):
        name = place.get("name") or "Chưa rõ tên"
        place_type = place.get("place_type") or "Chưa rõ loại"
        city = place.get("city") or "Chưa rõ thành phố"
        address = place.get("address") or "Chưa có địa chỉ"
        rating = place.get("rating")
        price = place.get("price_range")
        phone = place.get("phone")
        opening_hours = place.get("opening_hours")

        line = [
            f"{index}. Tên: {name}",
            f"Loại: {place_type}",
            f"Thành phố: {city}",
            f"Địa chỉ: {address}",
        ]
        if rating:
            line.append(f"Rating: {rating}/5")
        if price:
            line.append(f"Giá: {price}")
        if opening_hours:
            line.append(f"Giờ mở cửa: {opening_hours}")
        if phone:
            line.append(f"SĐT: {phone}")

        lines.append(" | ".join(line))

    return "\n".join(lines)


def _empty_answer(intent: Dict) -> str:
    city = intent.get("city")
    if city:
        return (
            f"Hiện dữ liệu của mình chưa có địa điểm phù hợp tại {city} cho yêu cầu này. "
            "Bạn có thể thử từ khóa khác, ví dụ: nhà hàng, khách sạn, quán cafe hoặc địa điểm tham quan."
        )

    return (
        "Hiện dữ liệu của mình chưa có địa điểm phù hợp cho yêu cầu này. "
        "Bạn có thể thử hỏi rõ hơn về thành phố hoặc loại địa điểm muốn tìm."
    )


def chat(message: str, history: List[Dict] = None) -> Dict:
    history = history or []
    intent = _extract_search_intent(message)
    logger.info("Intent: %s", intent)

    vector_results = semantic_search(
        query=message,
        top_k=20 if intent.get("city") else 8,
        place_type=intent.get("place_type"),
    )
    vector_results = [
        place for place in vector_results
        if _place_matches_city(place, intent.get("city"))
    ][:8]

    keyword = intent.get("place_type") or message
    keyword_results = search_places_by_keyword(
        keyword=keyword,
        city=intent.get("city"),
        place_type=intent.get("place_type"),
        limit=8,
    )
    keyword_results = [
        place for place in keyword_results
        if _place_matches_city(place, intent.get("city"))
    ]

    places = _merge_places(vector_results, keyword_results)[:8]

    if not places:
        return {
            "answer": _empty_answer(intent),
            "places": [],
            "sources_used": 0,
        }

    context = _format_places_context(places)
    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    for item in history[-6:]:
        role = item.get("role")
        content = item.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    city_rule = (
        f"Người dùng đang hỏi về thành phố: {intent['city']}. "
        "Chỉ dùng địa điểm có thành phố/địa chỉ khớp thành phố này."
        if intent.get("city")
        else "Người dùng chưa nêu thành phố cụ thể."
    )

    user_prompt = f"""Câu hỏi của người dùng: {message}

{city_rule}

{context}

Hãy trả lời chỉ dựa trên DỮ LIỆU ĐỊA ĐIỂM ở trên. Nếu cần liệt kê, ưu tiên 3-5 địa điểm phù hợp nhất."""

    messages.append(HumanMessage(content=user_prompt))

    logger.info("Calling Ollama model: %s", OLLAMA_MODEL)
    response = llm.invoke(messages)

    return {
        "answer": response.content.strip(),
        "places": places[:5],
        "sources_used": len(places),
    }
