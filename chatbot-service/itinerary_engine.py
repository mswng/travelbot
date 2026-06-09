"""
Itinerary Engine
================
- Receive itinerary requests from Spring Boot.
- Ask Ollama to generate a detailed Vietnamese travel itinerary as JSON.
- Index saved itineraries into FAISS for later RAG usage.
"""

import json
import logging
import os
import pickle
import re
import unicodedata
from typing import Dict, List

import faiss
from langchain.schema import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from config import OLLAMA_BASE_URL, OLLAMA_MODEL
from vector_store import FAISS_INDEX_DIR, _chunks, _embed, _index, _metadata

logger = logging.getLogger(__name__)

llm = ChatOllama(
    base_url=OLLAMA_BASE_URL,
    model=OLLAMA_MODEL,
    temperature=0.25,
    num_predict=4096,
    format="json",
)

ITINERARY_SYSTEM = """
You are TravelBot's Vietnam travel itinerary planner.
Return ONLY valid JSON. No markdown. No comments. No text outside JSON.
All user-facing values must be Vietnamese with accents.

Required JSON shape:
{
  "title": "string",
  "summary": "string",
  "content": {
    "overview": "string",
    "hotel_base": {
      "name": "specific hotel or homestay name",
      "address": "specific street/ward/area/city; if uncertain say address must be confirmed when booking",
      "area": "area name",
      "suggested_hotel_type": "hotel/homestay type matching budget",
      "estimated_price_per_night": "VND string such as 700.000 VND",
      "reason": "why this base optimizes the route"
    },
    "days": [
      {
        "day": 1,
        "title": "string",
        "date": "DD-MM-YYYY or empty string",
        "start_from": "hotel_base name and address",
        "activities": [
          {
            "start_time": "HH:MM",
            "end_time": "HH:MM",
            "title": "string",
            "from_location": "where this leg starts, usually hotel or previous activity",
            "location": "specific place name and area",
            "description": "specific experience details",
            "ticket_price": "VND string or Miễn phí",
            "estimated_cost": "other cost only; 0 VND if no other required cost",
            "transport": "realistic transport",
            "travel_time": "estimated time from from_location to location",
            "notes": "practical note"
          }
        ],
        "meals": [
          {
            "time": "HH:MM",
            "type": "Ăn sáng/Ăn trưa/Ăn tối",
            "place": "specific restaurant/area",
            "suggestion": "dishes to try",
            "estimated_cost": "VND string"
          }
        ],
        "daily_budget": "VND string",
        "route_summary": "hotel -> place 1 -> place 2 -> ... -> hotel",
        "tips": "string"
      }
    ],
    "budget_estimate": "breakdown by accommodation, meals, transport, tickets, other costs in VND",
    "total_trip_budget": "total VND budget for the entire trip",
    "transportation": "main transport plan and assumptions",
    "accommodation": {
      "recommended_area": "specific area",
      "hotel_suggestions": [
        {
          "name": "specific hotel/homestay name",
          "address": "specific street/ward/area/city",
          "estimated_price_per_night": "VND string",
          "why_choose": "reason"
        }
      ],
      "estimated_price_per_night": "VND string",
      "why_this_area": "reason"
    },
    "packing_tips": "string",
    "important_notes": "string"
  }
}

Quality rules:
- Pick a concrete hotel_base first, then build each day's route from that hotel.
- Each day must cover a full day from morning to evening with at least 5 activities/time blocks.
- A day must not contain only one activity. Include breakfast/first move, morning visit, lunch, afternoon visit, rest/check-in, dinner/evening walk when appropriate.
- Use realistic time windows across the day, for example 07:30-08:30, 09:00-11:00, 11:30-12:30, 14:00-16:00, 16:30-17:30, 18:30-20:00.
- travel_time must be based on from_location -> location and chosen transport.
- Activities after the first must start from the previous activity location.
- End the day near the hotel or include return-to-hotel logic in route_summary.
- Do not use bicycles for long trips, mountain roads, intercity legs, luggage-heavy legs, or after 18:00.
- Walking only for under 1.5 km. Bicycle only for 1-5 km flat urban legs. Taxi/Grab/motorbike for urban legs. Car/bus/train/flight for longer legs.
- ticket_price is only entrance/required experience ticket.
- estimated_cost excludes ticket_price. If ticket_price is Miễn phí and there is no required other cost, estimated_cost must be 0 VND.
- If a free place has parking/food/transport/service cost, write it clearly, e.g. Chi phí khác: 50.000 VND gửi xe.
- Restaurant/cafe/food activities must not have estimated_cost 0 VND. Estimate a realistic meal/drink cost in VND.
- Money must use dots as thousand separators, e.g. 4.000.000 VND.
- Price ranges must be low-to-high, e.g. 150.000 - 250.000 VND.
"""


def _extract_json(raw: str) -> Dict:
    text = raw.strip()
    if text.startswith("```json"):
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif text.startswith("```"):
        text = text.split("```", 1)[1].split("```", 1)[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        if start == -1:
            raise

        depth = 0
        in_string = False
        escaped = False
        for index in range(start, len(text)):
            char = text[index]
            if escaped:
                escaped = False
                continue
            if char == "\\":
                escaped = True
                continue
            if char == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    return json.loads(text[start:index + 1])
        raise


def _normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFD", str(text).lower())
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def _is_free_ticket(value: str) -> bool:
    normalized = _normalize_text(value)
    return any(marker in normalized for marker in [
        "mien phi",
        "free",
        "0 vnd",
        "0 dong",
        "0d",
    ])


def _has_non_zero_money(value: str) -> bool:
    normalized = _normalize_text(value)
    if not normalized.strip() or _is_free_ticket(normalized):
        return False
    return bool(re.search(r"[1-9][0-9.]*\s*(vnd|dong|d|₫)", normalized))


def _explains_other_cost(value: str) -> bool:
    normalized = _normalize_text(value)
    return any(keyword in normalized for keyword in [
        "chi phi khac",
        "di chuyen",
        "an uong",
        "an sang",
        "an trua",
        "an toi",
        "gui xe",
        "thue",
        "dich vu",
        "taxi",
        "grab",
        "xe may",
        "do an",
        "nuoc uong",
    ])


def _parse_vnd_number(value: str) -> int:
    digits = re.sub(r"\D", "", str(value))
    return int(digits) if digits else 0


def _fix_reversed_money_range(value: str) -> str:
    pattern = re.compile(r"(\d[\d.]*)\s*-\s*(\d[\d.]*)\s*(VND|vnd|₫|d|đ)")

    def replace(match):
        first, second, unit = match.groups()
        if _parse_vnd_number(first) <= _parse_vnd_number(second):
            return match.group(0)
        return f"{second} - {first} {unit}"

    return pattern.sub(replace, str(value))


def _looks_like_long_trip(text: str) -> bool:
    normalized = _normalize_text(text)
    long_trip_patterns = [
        r"\b([6-9]|[1-9][0-9]+)\s*km\b",
        "lien tinh",
        "cao toc",
        "deo",
        "nui",
        "san bay",
        "ga tau",
        "xe khach",
        "duong dai",
        "hanh ly",
    ]
    return any(re.search(pattern, normalized) for pattern in long_trip_patterns)


def _looks_like_food_activity(activity: Dict) -> bool:
    text = _normalize_text(" ".join([
        str(activity.get("title", "")),
        str(activity.get("location", "")),
        str(activity.get("description", "")),
    ]))
    return any(keyword in text for keyword in [
        "an sang",
        "an trua",
        "an toi",
        "nha hang",
        "quan an",
        "quan ca phe",
        "cafe",
        "ca phe",
        "am thuc",
        "hai san",
        "bun",
        "pho",
        "com",
    ])


def _is_zero_or_empty_cost(value: str) -> bool:
    normalized = _normalize_text(value)
    return not normalized.strip() or normalized in {
        "0",
        "0 vnd",
        "0 dong",
        "0d",
        "mien phi",
    }


def _fallback_content(destination: str, duration_days: int, start_date: str, budget: str) -> Dict:
    hotel_name = f"Khách sạn trung tâm {destination}"
    hotel_address = f"Khu trung tâm {destination}, địa chỉ cần xác nhận khi đặt phòng"
    days = []
    for day in range(1, duration_days + 1):
        days.append({
            "day": day,
            "title": f"Ngày {day}: Khám phá {destination}",
            "date": "",
            "start_from": f"{hotel_name} - {hotel_address}",
            "activities": [
                {
                    "start_time": "08:00",
                    "end_time": "08:45",
                    "title": "Ăn sáng gần khách sạn",
                    "from_location": f"{hotel_name} - {hotel_address}",
                    "location": f"Quán ăn địa phương tại khu trung tâm {destination}",
                    "description": "Bắt đầu ngày bằng món ăn địa phương, ưu tiên quán gần nơi lưu trú.",
                    "ticket_price": "Miễn phí",
                    "estimated_cost": "Chi phí ăn uống: 80.000 - 150.000 VND",
                    "transport": "Đi bộ hoặc Taxi/Grab nếu xa",
                    "travel_time": "5 - 15 phút từ khách sạn",
                    "notes": "Chọn quán đông khách địa phương.",
                },
                {
                    "start_time": "09:00",
                    "end_time": "11:00",
                    "title": "Tham quan điểm nổi bật gần khu lưu trú",
                    "from_location": f"Quán ăn địa phương tại khu trung tâm {destination}",
                    "location": f"Điểm tham quan trung tâm {destination}",
                    "description": "Tham quan điểm nổi bật trong khu trung tâm, phù hợp lịch nhẹ nhàng.",
                    "ticket_price": "Miễn phí",
                    "estimated_cost": "0 VND",
                    "transport": "Taxi/Grab hoặc xe máy",
                    "travel_time": "10 - 20 phút",
                    "notes": "Kiểm tra giờ mở cửa trước khi đi.",
                },
                {
                    "start_time": "11:30",
                    "end_time": "12:45",
                    "title": "Ăn trưa",
                    "from_location": f"Điểm tham quan trung tâm {destination}",
                    "location": f"Nhà hàng địa phương tại {destination}",
                    "description": "Dùng bữa trưa với món đặc sản địa phương.",
                    "ticket_price": "Miễn phí",
                    "estimated_cost": "Chi phí ăn uống: 150.000 - 250.000 VND",
                    "transport": "Taxi/Grab hoặc đi bộ nếu gần",
                    "travel_time": "10 - 15 phút",
                    "notes": "Nên đặt bàn nếu đi cuối tuần.",
                },
                {
                    "start_time": "14:00",
                    "end_time": "16:00",
                    "title": "Khám phá điểm tham quan buổi chiều",
                    "from_location": f"Nhà hàng địa phương tại {destination}",
                    "location": f"Khu tham quan/văn hóa tại {destination}",
                    "description": "Dành buổi chiều cho hoạt động văn hóa hoặc cảnh quan phù hợp sở thích.",
                    "ticket_price": "50.000 - 150.000 VND",
                    "estimated_cost": "0 VND",
                    "transport": "Taxi/Grab hoặc xe máy",
                    "travel_time": "15 - 25 phút",
                    "notes": "Mang nước và kem chống nắng.",
                },
                {
                    "start_time": "16:30",
                    "end_time": "17:30",
                    "title": "Nghỉ ngơi tại khách sạn",
                    "from_location": f"Khu tham quan/văn hóa tại {destination}",
                    "location": f"{hotel_name} - {hotel_address}",
                    "description": "Quay về khách sạn nghỉ ngơi, tắm rửa và chuẩn bị cho buổi tối.",
                    "ticket_price": "Miễn phí",
                    "estimated_cost": "0 VND",
                    "transport": "Taxi/Grab",
                    "travel_time": "15 - 25 phút",
                    "notes": "Giúp lịch trình không bị quá tải.",
                },
                {
                    "start_time": "18:30",
                    "end_time": "20:00",
                    "title": "Ăn tối và dạo phố",
                    "from_location": f"{hotel_name} - {hotel_address}",
                    "location": f"Khu ăn tối trung tâm {destination}",
                    "description": "Ăn tối, dạo phố hoặc chợ đêm nếu phù hợp.",
                    "ticket_price": "Miễn phí",
                    "estimated_cost": "Chi phí ăn uống: 200.000 - 350.000 VND",
                    "transport": "Taxi/Grab",
                    "travel_time": "10 - 20 phút",
                    "notes": "Tránh di chuyển quá xa vào buổi tối.",
                },
            ],
            "meals": [
                {
                    "time": "12:00",
                    "type": "Ăn trưa",
                    "place": f"Nhà hàng địa phương tại {destination}",
                    "suggestion": "Món đặc sản địa phương",
                    "estimated_cost": "150.000 - 250.000 VND",
                }
            ],
            "daily_budget": "800.000 - 1.200.000 VND",
            "route_summary": f"{hotel_name} -> khu trung tâm {destination} -> {hotel_name}",
            "tips": "Kiểm tra giờ mở cửa và đặt phòng trước.",
        })

    return {
        "overview": f"Lịch trình {duration_days} ngày tại {destination}, tối ưu theo ngân sách {budget}.",
        "hotel_base": {
            "name": hotel_name,
            "address": hotel_address,
            "area": f"Khu trung tâm {destination}",
            "suggested_hotel_type": "Khách sạn/homestay phù hợp ngân sách",
            "estimated_price_per_night": "600.000 - 900.000 VND",
            "reason": "Làm điểm xuất phát thuận tiện để đi các điểm chính.",
        },
        "days": days,
        "budget_estimate": "Lưu trú: 600.000 - 900.000 VND/đêm; ăn uống: 300.000 - 500.000 VND/ngày; di chuyển và vé: tùy điểm đến.",
        "total_trip_budget": f"{duration_days * 1_200_000:,}".replace(",", ".") + " VND",
        "transportation": "Ưu tiên Taxi/Grab trong nội thành; xe khách/tàu/máy bay cho chặng xa.",
        "accommodation": {
            "recommended_area": f"Khu trung tâm {destination}",
            "hotel_suggestions": [
                {
                    "name": hotel_name,
                    "address": hotel_address,
                    "estimated_price_per_night": "600.000 - 900.000 VND",
                    "why_choose": "Thuận tiện làm điểm xuất phát.",
                }
            ],
            "estimated_price_per_night": "600.000 - 900.000 VND",
            "why_this_area": "Dễ di chuyển và nhiều lựa chọn ăn uống.",
        },
        "packing_tips": "Mang giấy tờ tùy thân, kem chống nắng, giày thoải mái, sạc dự phòng.",
        "important_notes": "Đây là lịch fallback vì AI chưa trả JSON hợp lệ; nên tạo lại để có lịch chi tiết hơn.",
    }


def _build_full_day_activities(destination: str, day: Dict, hotel_label: str) -> List[Dict]:
    existing = day.get("activities") or []
    first_existing = existing[0] if existing else {}
    focus_location = first_existing.get("location") or f"Điểm tham quan trung tâm {destination}"
    focus_title = first_existing.get("title") or f"Khám phá {destination}"

    return [
        {
            "start_time": "07:30",
            "end_time": "08:30",
            "title": "Ăn sáng gần khách sạn",
            "from_location": hotel_label,
            "location": f"Quán ăn địa phương gần {hotel_label}",
            "description": "Ăn sáng nhẹ, chuẩn bị cho lịch trình trong ngày.",
            "ticket_price": "Miễn phí",
            "estimated_cost": "Chi phí ăn uống: 80.000 - 150.000 VND",
            "transport": "Đi bộ hoặc Taxi/Grab nếu xa",
            "travel_time": "5 - 15 phút",
            "notes": "Ưu tiên quán gần khách sạn để tiết kiệm thời gian.",
        },
        {
            "start_time": "09:00",
            "end_time": "11:00",
            "title": focus_title,
            "from_location": f"Quán ăn địa phương gần {hotel_label}",
            "location": focus_location,
            "description": first_existing.get("description") or "Tham quan điểm nổi bật theo sở thích của chuyến đi.",
            "ticket_price": first_existing.get("ticket_price") or "Miễn phí",
            "estimated_cost": first_existing.get("estimated_cost") or "0 VND",
            "transport": first_existing.get("transport") or "Taxi/Grab hoặc xe máy",
            "travel_time": first_existing.get("travel_time") or "10 - 25 phút",
            "notes": first_existing.get("notes") or "Kiểm tra giờ mở cửa trước khi đi.",
        },
        {
            "start_time": "11:30",
            "end_time": "12:45",
            "title": "Ăn trưa",
            "from_location": focus_location,
            "location": f"Nhà hàng địa phương gần {focus_location}",
            "description": "Dùng bữa trưa với món đặc sản địa phương.",
            "ticket_price": "Miễn phí",
            "estimated_cost": "Chi phí ăn uống: 150.000 - 250.000 VND",
            "transport": "Đi bộ hoặc Taxi/Grab nếu xa",
            "travel_time": "10 - 15 phút",
            "notes": "Nên chọn quán gần điểm tham quan để tối ưu cung đường.",
        },
        {
            "start_time": "14:00",
            "end_time": "16:00",
            "title": "Hoạt động buổi chiều",
            "from_location": f"Nhà hàng địa phương gần {focus_location}",
            "location": f"Khu tham quan/văn hóa tại {destination}",
            "description": "Tiếp tục khám phá một điểm gần tuyến buổi sáng, tránh di chuyển vòng vo.",
            "ticket_price": "50.000 - 150.000 VND",
            "estimated_cost": "0 VND",
            "transport": "Taxi/Grab hoặc xe máy",
            "travel_time": "15 - 25 phút",
            "notes": "Chọn điểm gần khu vực đang ở để tiết kiệm thời gian.",
        },
        {
            "start_time": "16:30",
            "end_time": "17:30",
            "title": "Nghỉ ngơi tại khách sạn",
            "from_location": f"Khu tham quan/văn hóa tại {destination}",
            "location": hotel_label,
            "description": "Quay về khách sạn nghỉ ngơi trước buổi tối.",
            "ticket_price": "Miễn phí",
            "estimated_cost": "0 VND",
            "transport": "Taxi/Grab",
            "travel_time": "15 - 25 phút",
            "notes": "Giữ nhịp lịch trình thoải mái.",
        },
        {
            "start_time": "18:30",
            "end_time": "20:00",
            "title": "Ăn tối và dạo phố",
            "from_location": hotel_label,
            "location": f"Khu ăn tối trung tâm {destination}",
            "description": "Ăn tối, dạo phố hoặc chợ đêm nếu phù hợp.",
            "ticket_price": "Miễn phí",
            "estimated_cost": "Chi phí ăn uống: 200.000 - 350.000 VND",
            "transport": "Taxi/Grab",
            "travel_time": "10 - 20 phút",
            "notes": "Tránh di chuyển quá xa vào buổi tối.",
        },
    ]


def _sanitize_content(content: Dict, destination: str, duration_days: int, start_date: str, budget: str) -> Dict:
    if not isinstance(content, dict):
        content = {}

    fallback = _fallback_content(destination, duration_days, start_date, budget)
    content.setdefault("overview", fallback["overview"])
    content.setdefault("hotel_base", fallback["hotel_base"])
    days = content.get("days")
    if not isinstance(days, list):
        days = []

    if len(days) < duration_days:
        days = [
            *days,
            *fallback["days"][len(days):duration_days],
        ]
    elif len(days) > duration_days:
        days = days[:duration_days]

    for index, day in enumerate(days, start=1):
        if isinstance(day, dict):
            day["day"] = index
            day.setdefault("title", f"Ngày {index}: Khám phá {destination}")

    content["days"] = days
    content.setdefault("budget_estimate", fallback["budget_estimate"])
    content.setdefault("total_trip_budget", fallback["total_trip_budget"])
    content.setdefault("transportation", fallback["transportation"])
    content.setdefault("accommodation", fallback["accommodation"])
    content.setdefault("packing_tips", fallback["packing_tips"])
    content.setdefault("important_notes", "")

    hotel_base = content.get("hotel_base") or fallback["hotel_base"]
    hotel_name = hotel_base.get("name") or fallback["hotel_base"]["name"]
    hotel_address = hotel_base.get("address") or fallback["hotel_base"]["address"]
    hotel_label = f"{hotel_name} - {hotel_address}"

    for day in content.get("days", []):
        day.setdefault("start_from", hotel_label)
        if len(day.get("activities") or []) < 5:
            day["activities"] = _build_full_day_activities(destination, day, hotel_label)

        previous_location = day["start_from"]
        for activity in day.get("activities", []):
            activity.setdefault("from_location", previous_location)
            activity.setdefault("ticket_price", "Miễn phí")
            activity.setdefault("estimated_cost", "0 VND")
            activity.setdefault("transport", "Taxi/Grab hoặc đi bộ nếu gần")
            activity.setdefault("travel_time", "Chưa có dữ liệu, cần xác nhận")

            ticket_price = str(activity.get("ticket_price", "")).strip()
            estimated_cost = _fix_reversed_money_range(str(activity.get("estimated_cost", "")).strip())
            activity["estimated_cost"] = estimated_cost or "0 VND"

            if _is_free_ticket(ticket_price) and _has_non_zero_money(estimated_cost):
                if not _explains_other_cost(estimated_cost):
                    activity["estimated_cost"] = "0 VND"
                    notes = str(activity.get("notes", "")).strip()
                    cost_note = "Giá vé miễn phí; chi phí khác chỉ phát sinh nếu ăn uống, gửi xe hoặc dùng dịch vụ riêng."
                    activity["notes"] = f"{notes} {cost_note}".strip()
                elif "chi phi khac" not in _normalize_text(estimated_cost):
                    activity["estimated_cost"] = f"Chi phí khác: {estimated_cost}"

            if _looks_like_food_activity(activity) and _is_zero_or_empty_cost(activity.get("estimated_cost", "")):
                activity["ticket_price"] = "Miễn phí"
                activity["estimated_cost"] = "Chi phí ăn uống: 150.000 - 250.000 VND"

            transport = str(activity.get("transport", ""))
            context = " ".join([
                transport,
                str(activity.get("description", "")),
                str(activity.get("travel_time", "")),
                str(activity.get("location", "")),
            ])
            if "xe đạp" in transport.lower() and _looks_like_long_trip(context):
                activity["transport"] = "Taxi/Grab hoặc ô tô riêng"
                notes = str(activity.get("notes", "")).strip()
                safety_note = "Không khuyến nghị đi xe đạp cho chặng này vì khoảng cách/địa hình không phù hợp."
                activity["notes"] = f"{notes} {safety_note}".strip()

            previous_location = activity.get("location") or previous_location

        for meal in day.get("meals", []):
            if isinstance(meal, dict):
                if _is_zero_or_empty_cost(meal.get("estimated_cost", "")):
                    meal["estimated_cost"] = "150.000 - 250.000 VND"
                else:
                    meal["estimated_cost"] = _fix_reversed_money_range(meal["estimated_cost"])

    return content


def _repair_with_llm(raw: str) -> Dict:
    repair_messages = [
        SystemMessage(content=ITINERARY_SYSTEM),
        HumanMessage(content=(
            "Convert this invalid itinerary response into the required valid JSON shape. "
            "Return only valid JSON.\n\n"
            f"{raw[:12000]}"
        )),
    ]
    response = llm.invoke(repair_messages)
    return _extract_json(response.content)


def generate_itinerary(
    destination: str,
    duration_days: int,
    start_date: str = "",
    preferences: str = "",
    budget: str = "trung bình",
) -> Dict:
    user_msg = f"""
Create a complete travel itinerary:
- Destination: {destination}
- Duration: {duration_days} days
- Start date: {start_date if start_date else "flexible"}
- Preferences: {preferences if preferences else "general"}
- Budget: {budget}

Return only valid JSON matching the required shape. Choose a specific hotel base first,
then calculate each travel leg from hotel or previous activity.
"""

    messages = [
        SystemMessage(content=ITINERARY_SYSTEM),
        HumanMessage(content=user_msg),
    ]

    logger.info("Generating itinerary for %s, %s days...", destination, duration_days)
    response = llm.invoke(messages)
    raw = response.content.strip()

    data = None
    try:
        data = _extract_json(raw)
    except json.JSONDecodeError:
        logger.warning("LLM did not return valid JSON, attempting JSON repair")
        try:
            data = _repair_with_llm(raw)
        except json.JSONDecodeError:
            logger.warning("JSON repair failed, using structured fallback JSON")

    if not isinstance(data, dict):
        data = {
            "title": f"Lịch trình {destination} {duration_days} ngày",
            "summary": f"Lịch trình {duration_days} ngày tại {destination}",
            "content": _fallback_content(destination, duration_days, start_date, budget),
        }

    content = _sanitize_content(
        data.get("content", {}),
        destination,
        duration_days,
        start_date,
        budget,
    )

    return {
        "title": data.get("title", f"Lịch trình {destination} {duration_days} ngày"),
        "summary": data.get("summary", f"Lịch trình {duration_days} ngày tại {destination}"),
        "content": json.dumps(content, ensure_ascii=False),
    }


def index_itineraries(itineraries: List[Dict]) -> int:
    """
    Index itineraries into the existing FAISS index.
    Each itinerary creates two chunks: title/summary and content.
    """
    global _index, _chunks, _metadata

    if _index is None:
        logger.warning("FAISS index is not loaded, skipping itinerary indexing")
        return 0

    texts, metas = [], []
    for it in itineraries:
        iid = str(it.get("id", ""))

        identity_text = (
            f"Lịch trình: {it.get('title', '')}. "
            f"Điểm đến: {it.get('destination', '')}. "
            f"Tóm tắt: {it.get('summary', '')}"
        )
        texts.append(identity_text)
        metas.append({
            "chunk_type": "itinerary_identity",
            "itinerary_id": iid,
            "title": it.get("title", ""),
            "destination": it.get("destination", ""),
        })

        content = it.get("content", "")
        if len(content) > 500:
            content = content[:500] + "..."
        content_text = f"Chi tiết lịch trình {it.get('destination', '')}: {content}"
        texts.append(content_text)
        metas.append({
            "chunk_type": "itinerary_content",
            "itinerary_id": iid,
            "title": it.get("title", ""),
            "destination": it.get("destination", ""),
        })

    if not texts:
        return 0

    vectors = _embed(texts)
    _index.add(vectors)
    _chunks.extend(texts)
    _metadata.extend(metas)

    faiss.write_index(_index, os.path.join(FAISS_INDEX_DIR, "places.index"))
    with open(os.path.join(FAISS_INDEX_DIR, "metadata.pkl"), "wb") as f:
        pickle.dump(_metadata, f)
    with open(os.path.join(FAISS_INDEX_DIR, "chunks.pkl"), "wb") as f:
        pickle.dump(_chunks, f)

    logger.info("Indexed %s itineraries (%s chunks) into FAISS", len(itineraries), len(texts))
    return len(itineraries)
