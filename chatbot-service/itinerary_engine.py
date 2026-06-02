"""
Itinerary Engine
================
- Nhận request từ Spring Boot
- Gọi Ollama tạo lịch trình dạng JSON
- Index vào FAISS để RAG dùng lại
"""

from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage, SystemMessage
from config import OLLAMA_BASE_URL, OLLAMA_MODEL
from vector_store import _embed, _index, _metadata, _chunks, FAISS_INDEX_DIR
import faiss, pickle, os, json, logging
from typing import List, Dict

logger = logging.getLogger(__name__)

llm = ChatOllama(base_url=OLLAMA_BASE_URL, model=OLLAMA_MODEL,
                 temperature=0.8, num_predict=2048)

ITINERARY_SYSTEM = """Bạn là chuyên gia lên kế hoạch du lịch Việt Nam.
Hãy tạo lịch trình chi tiết, thực tế và hữu ích.
Trả lời ĐÚNG theo định dạng JSON sau, không thêm text khác:
{
  "title": "Tên lịch trình",
  "summary": "Tóm tắt 2-3 câu về lịch trình",
  "content": {
    "overview": "Mô tả tổng quan",
    "days": [
      {
        "day": 1,
        "title": "Tiêu đề ngày 1",
        "morning": "Hoạt động buổi sáng",
        "afternoon": "Hoạt động buổi chiều",
        "evening": "Hoạt động buổi tối",
        "meals": "Gợi ý ăn uống",
        "tips": "Lưu ý quan trọng"
      }
    ],
    "budget_estimate": "Ước tính chi phí",
    "transportation": "Gợi ý di chuyển",
    "accommodation": "Gợi ý lưu trú",
    "packing_tips": "Đồ cần mang theo"
  }
}"""


def generate_itinerary(destination: str, duration_days: int,
                       start_date: str = "", preferences: str = "",
                       budget: str = "trung bình") -> Dict:
    user_msg = f"""Tạo lịch trình du lịch:
- Điểm đến: {destination}
- Số ngày: {duration_days} ngày
- Ngày khởi hành: {start_date if start_date else 'linh hoạt'}
- Sở thích: {preferences if preferences else 'tổng hợp'}
- Ngân sách: {budget}

Tạo lịch trình chi tiết theo đúng format JSON được yêu cầu."""

    messages = [SystemMessage(content=ITINERARY_SYSTEM),
                HumanMessage(content=user_msg)]

    logger.info(f"Generating itinerary for {destination}, {duration_days} days...")
    response = llm.invoke(messages)
    raw = response.content.strip()

    # Parse JSON từ response
    try:
        # Xử lý trường hợp LLM wrap trong ```json ... ```
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()

        data = json.loads(raw)
        return {
            "title":   data.get("title", f"Lịch trình {destination} {duration_days} ngày"),
            "summary": data.get("summary", ""),
            "content": json.dumps(data.get("content", {}), ensure_ascii=False)
        }
    except json.JSONDecodeError:
        # Fallback nếu LLM không trả đúng JSON
        logger.warning("LLM did not return valid JSON, using raw text")
        return {
            "title":   f"Lịch trình {destination} {duration_days} ngày",
            "summary": f"Lịch trình {duration_days} ngày tại {destination}",
            "content": raw
        }


def index_itineraries(itineraries: List[Dict]) -> int:
    """
    Index lịch trình vào FAISS index hiện có.
    Mỗi itinerary → 2 chunks: title+summary và content
    """
    global _index, _chunks, _metadata

    if _index is None:
        logger.warning("FAISS index chưa được load, bỏ qua index itinerary")
        return 0

    texts, metas = [], []
    for it in itineraries:
        iid = str(it.get("id", ""))

        # Chunk 1: identity
        t1 = f"Lịch trình: {it.get('title','')}. Điểm đến: {it.get('destination','')}. Tóm tắt: {it.get('summary','')}"
        texts.append(t1)
        metas.append({"chunk_type": "itinerary_identity", "itinerary_id": iid,
                      "title": it.get("title",""), "destination": it.get("destination","")})

        # Chunk 2: content (tóm tắt 500 ký tự đầu)
        content = it.get("content", "")
        if len(content) > 500:
            content = content[:500] + "..."
        t2 = f"Chi tiết lịch trình {it.get('destination','')}: {content}"
        texts.append(t2)
        metas.append({"chunk_type": "itinerary_content", "itinerary_id": iid,
                      "title": it.get("title",""), "destination": it.get("destination","")})

    if not texts:
        return 0

    vectors = _embed(texts)
    _index.add(vectors)
    _chunks.extend(texts)
    _metadata.extend(metas)

    # Persist lại
    import faiss as _faiss
    _faiss.write_index(_index, os.path.join(FAISS_INDEX_DIR, "places.index"))
    with open(os.path.join(FAISS_INDEX_DIR, "metadata.pkl"), "wb") as f:
        pickle.dump(_metadata, f)
    with open(os.path.join(FAISS_INDEX_DIR, "chunks.pkl"), "wb") as f:
        pickle.dump(_chunks, f)

    logger.info(f"Indexed {len(itineraries)} itineraries ({len(texts)} chunks) into FAISS")
    return len(itineraries)
