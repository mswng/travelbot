"""
Field-based Chunking Strategy
==============================
Mỗi place được chia thành nhiều chunk nhỏ theo từng field.
Lý do: embedding 1 đoạn ngắn, tập trung = tìm kiếm chính xác hơn.

Ví dụ 1 place → 3-5 chunks:
  Chunk 1 (identity):    "Tên: Nhà hàng Phở Bắc. Loại: restaurant. Thành phố: Hà Nội"
  Chunk 2 (location):    "Địa chỉ: 25 Hàng Trống, Hoàn Kiếm, Hà Nội. Thành phố: Hà Nội"
  Chunk 3 (description): "Mô tả: Quán phở truyền thống... [đoạn 1]"
  Chunk 4 (description): "Mô tả: ...nước dùng đậm đà... [đoạn 2]"  ← nếu description dài
  Chunk 5 (practical):   "Giờ mở cửa: 6:00-22:00. Giá: 50k-100k. SĐT: 024..."
"""

from typing import List, Dict

# Độ dài tối đa của mỗi chunk (tính bằng ký tự)
DESCRIPTION_CHUNK_SIZE = 300
DESCRIPTION_OVERLAP    = 50   # Overlap giữa các chunk description để không mất context


def chunk_place(place: Dict) -> List[Dict]:
    """
    Chia 1 place thành nhiều chunk.
    Mỗi chunk là dict gồm: text, chunk_type, metadata.
    """
    chunks = []
    place_id = str(place.get("id", ""))
    place_google_id = str(place.get("place_id") or "")

    # Metadata chung - gắn vào mọi chunk để sau search biết chunk thuộc place nào
    base_meta = {
        "place_db_id": place_id,
        "place_google_id": place_google_id,
        "name": str(place.get("name") or ""),
        "city": str(place.get("city") or ""),
        "place_type": str(place.get("place_type") or ""),
        "rating": float(place["rating"]) if place.get("rating") else 0.0,
        "address": str(place.get("address") or ""),
        "price_range": str(place.get("price_range") or ""),
        "phone": str(place.get("phone") or ""),
        "photo_url": str(place.get("photo_url") or ""),
        "opening_hours": str(place.get("opening_hours") or ""),
        "website": str(place.get("website") or ""),
    }

    # ── CHUNK 1: Identity chunk ──────────────────────────────────────────────
    # Mục đích: tìm theo tên, loại hình, thành phố
    identity_parts = []
    if place.get("name"):
        identity_parts.append(f"Tên: {place['name']}")
    if place.get("place_type"):
        identity_parts.append(f"Loại hình: {place['place_type']}")
    if place.get("city"):
        identity_parts.append(f"Thành phố: {place['city']}")
    if place.get("country"):
        identity_parts.append(f"Quốc gia: {place['country']}")
    if place.get("rating"):
        identity_parts.append(f"Đánh giá: {place['rating']}/5 ({place.get('total_ratings', 0)} lượt đánh giá)")

    if identity_parts:
        chunks.append({
            "text": ". ".join(identity_parts),
            "chunk_type": "identity",
            "chunk_index": 0,
            "metadata": {**base_meta, "chunk_type": "identity"}
        })

    # ── CHUNK 2: Location chunk ──────────────────────────────────────────────
    # Mục đích: tìm theo địa chỉ, khu vực
    location_parts = []
    if place.get("address"):
        location_parts.append(f"Địa chỉ: {place['address']}")
    if place.get("city"):
        location_parts.append(f"Thành phố: {place['city']}")

    if location_parts:
        chunks.append({
            "text": ". ".join(location_parts),
            "chunk_type": "location",
            "chunk_index": 0,
            "metadata": {**base_meta, "chunk_type": "location"}
        })

    # ── CHUNK 3+: Description chunks (sliding window) ────────────────────────
    # Mục đích: tìm theo nội dung mô tả chi tiết
    description = str(place.get("description") or "").strip()
    if description:
        desc_chunks = _sliding_window(
            text=description,
            chunk_size=DESCRIPTION_CHUNK_SIZE,
            overlap=DESCRIPTION_OVERLAP
        )
        for i, desc_chunk in enumerate(desc_chunks):
            prefix = f"Địa điểm: {place.get('name', '')}. Mô tả: "
            chunks.append({
                "text": prefix + desc_chunk,
                "chunk_type": "description",
                "chunk_index": i,
                "metadata": {**base_meta, "chunk_type": "description", "desc_chunk_index": i}
            })

    # ── CHUNK 4: Practical info chunk ────────────────────────────────────────
    # Mục đích: tìm theo giờ mở cửa, giá, SĐT
    practical_parts = []
    if place.get("opening_hours"):
        practical_parts.append(f"Giờ mở cửa: {place['opening_hours']}")
    if place.get("price_range"):
        practical_parts.append(f"Khoảng giá: {place['price_range']}")
    if place.get("price_level"):
        levels = {1: "Bình dân", 2: "Trung bình", 3: "Cao cấp", 4: "Sang trọng"}
        practical_parts.append(f"Mức giá: {levels.get(place['price_level'], str(place['price_level']))}")
    if place.get("phone"):
        practical_parts.append(f"Điện thoại: {place['phone']}")
    if place.get("website"):
        practical_parts.append(f"Website: {place['website']}")

    if practical_parts:
        prefix = f"Thông tin thực tế của {place.get('name', 'địa điểm')}: "
        chunks.append({
            "text": prefix + ". ".join(practical_parts),
            "chunk_type": "practical",
            "chunk_index": 0,
            "metadata": {**base_meta, "chunk_type": "practical"}
        })

    return chunks


def _sliding_window(text: str, chunk_size: int, overlap: int) -> List[str]:
    """
    Chia text dài thành các đoạn nhỏ với sliding window.
    Cố gắng cắt tại dấu câu để tự nhiên hơn.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        if end >= len(text):
            chunks.append(text[start:].strip())
            break

        # Tìm điểm cắt tự nhiên: ưu tiên dấu câu
        cut = end
        for sep in [". ", "! ", "? ", ", ", " "]:
            pos = text.rfind(sep, start + chunk_size // 2, end)
            if pos != -1:
                cut = pos + len(sep)
                break

        chunks.append(text[start:cut].strip())
        start = cut - overlap  # Overlap để giữ context

    return [c for c in chunks if c]  # Bỏ chunk rỗng


def chunk_all_places(places: List[Dict]) -> List[Dict]:
    """Chunk toàn bộ danh sách places."""
    all_chunks = []
    for place in places:
        all_chunks.extend(chunk_place(place))
    return all_chunks
