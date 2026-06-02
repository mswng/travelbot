from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from vector_store import semantic_search
from database import search_places_by_keyword
from config import OLLAMA_BASE_URL, OLLAMA_MODEL
from typing import List, Dict
import logging
import re

logger = logging.getLogger(__name__)

# Khởi tạo LLM một lần
llm = ChatOllama(
    base_url=OLLAMA_BASE_URL,
    model=OLLAMA_MODEL,
    temperature=0.7,
    num_predict=1024,
)

SYSTEM_PROMPT = """Bạn là trợ lý du lịch thông minh, am hiểu các địa điểm du lịch, 
nhà hàng, quán cafe tại Việt Nam. Bạn trả lời bằng tiếng Việt, thân thiện và hữu ích.

Khi được cung cấp thông tin về các địa điểm, hãy dựa vào đó để trả lời.
Nếu không có thông tin phù hợp, hãy thành thật nói không tìm thấy và gợi ý người dùng 
thử từ khóa khác hoặc tìm trên Google Maps.

Định dạng câu trả lời:
- Trả lời ngắn gọn, rõ ràng
- Nếu gợi ý địa điểm, liệt kê tên + địa chỉ
- Không bịa đặt thông tin"""


def _extract_search_intent(message: str) -> Dict:
    """Trích xuất ý định tìm kiếm từ câu hỏi của user."""
    message_lower = message.lower()

    # Detect city
    city = None
    city_keywords = {
        "hà nội": "Hà Nội", "hanoi": "Hà Nội",
        "hồ chí minh": "Hồ Chí Minh", "sài gòn": "Hồ Chí Minh", "saigon": "Hồ Chí Minh", "hcm": "Hồ Chí Minh",
        "đà nẵng": "Đà Nẵng", "da nang": "Đà Nẵng",
        "hội an": "Hội An", "hoi an": "Hội An",
        "nha trang": "Nha Trang",
        "đà lạt": "Đà Lạt", "da lat": "Đà Lạt",
        "phú quốc": "Phú Quốc", "phu quoc": "Phú Quốc",
        "huế": "Huế", "hue": "Huế",
    }
    for kw, city_name in city_keywords.items():
        if kw in message_lower:
            city = city_name
            break

    # Detect place type
    place_type = None
    type_keywords = {
        "nhà hàng": "restaurant", "restaurant": "restaurant", "ăn": "restaurant",
        "quán ăn": "restaurant", "đồ ăn": "restaurant",
        "cafe": "cafe", "cà phê": "cafe", "coffee": "cafe",
        "khách sạn": "hotel", "hotel": "hotel", "resort": "resort",
        "du lịch": "tourist_attraction", "tham quan": "tourist_attraction",
        "điểm đến": "tourist_attraction", "địa điểm": "tourist_attraction",
        "bar": "bar", "pub": "bar",
        "mua sắm": "shopping", "chợ": "market",
    }
    for kw, ptype in type_keywords.items():
        if kw in message_lower:
            place_type = ptype
            break

    return {"city": city, "place_type": place_type}


def _format_places_context(places: List[Dict]) -> str:
    """Format danh sách địa điểm thành context cho LLM."""
    if not places:
        return "Không tìm thấy địa điểm phù hợp."

    lines = ["=== THÔNG TIN ĐỊA ĐIỂM ==="]
    for i, p in enumerate(places[:5], 1):  # Max 5 địa điểm
        name = p.get("name", "")
        city = p.get("city", "")
        address = p.get("address", "")
        price = p.get("price_range", "")
        phone = p.get("phone", "")
        ptype = p.get("place_type", "")

        line = f"{i}. {name}"
        if ptype: line += f" ({ptype})"
        if city: line += f" - {city}"
        if address: line += f"\n   📍 {address}"
        if price: line += f" | 💰 {price}"
        if phone: line += f"\n   📞 {phone}"

        lines.append(line)

    return "\n".join(lines)


def chat(message: str, history: List[Dict] = None) -> Dict:
    """
    Xử lý một lượt chat với RAG.
    
    Args:
        message: Câu hỏi của user
        history: Lịch sử chat [{"role": "user/assistant", "content": "..."}]
    
    Returns:
        {"answer": str, "places": List[Dict], "sources_used": int}
    """
    history = history or []

    # 1. Phân tích intent
    intent = _extract_search_intent(message)
    logger.info(f"Intent: {intent}")

    # 2. RAG - tìm kiếm song song: vector search + keyword search
    vector_results = semantic_search(
        query=message,
        top_k=5,
        city=intent.get("city"),
        place_type=intent.get("place_type")
    )

    # Nếu vector search ít kết quả, bổ sung bằng keyword search
    keyword_results = []
    if len(vector_results) < 3:
        keyword_results = search_places_by_keyword(
            keyword=message,
            city=intent.get("city"),
            place_type=intent.get("place_type"),
            limit=5
        )

    # Merge kết quả, ưu tiên vector search
    seen_ids = {p.get("id") for p in vector_results}
    merged = list(vector_results)
    for p in keyword_results:
        if str(p.get("id")) not in seen_ids:
            merged.append(p)

    # 3. Build context
    context = _format_places_context(merged)

    # 4. Build messages cho LLM
    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    # Thêm lịch sử chat (tối đa 6 lượt gần nhất)
    for h in history[-6:]:
        if h["role"] == "user":
            messages.append(HumanMessage(content=h["content"]))
        else:
            messages.append(AIMessage(content=h["content"]))

    # Câu hỏi hiện tại kèm context
    user_msg = f"""Câu hỏi: {message}

{context}

Hãy trả lời dựa vào thông tin trên. Nếu không liên quan đến địa điểm, 
trả lời bình thường như trợ lý du lịch."""

    messages.append(HumanMessage(content=user_msg))

    # 5. Gọi LLM
    logger.info(f"Calling Ollama model: {OLLAMA_MODEL}")
    response = llm.invoke(messages)
    answer = response.content.strip()

    return {
        "answer": answer,
        "places": merged[:5],
        "sources_used": len(merged)
    }
