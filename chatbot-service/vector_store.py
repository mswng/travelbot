"""
FAISS Vector Store
==================
- Dùng FAISS IndexFlatIP (Inner Product) với normalized vectors = cosine similarity
- Lưu index + metadata ra disk (./faiss_index/)
- Hỗ trợ rebuild khi data thay đổi
"""

import os
import pickle
import logging
from typing import List, Dict, Optional

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

from config import FAISS_INDEX_DIR, EMBEDDING_MODEL
from database import get_all_places
from chunker import chunk_all_places

logger = logging.getLogger(__name__)

INDEX_FILE    = os.path.join(FAISS_INDEX_DIR, "places.index")
METADATA_FILE = os.path.join(FAISS_INDEX_DIR, "metadata.pkl")
CHUNKS_FILE   = os.path.join(FAISS_INDEX_DIR, "chunks.pkl")

_model: Optional[SentenceTransformer] = None
_index: Optional[faiss.Index] = None
_chunks: Optional[List[str]] = None
_metadata: Optional[List[Dict]] = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def _embed(texts: List[str]) -> np.ndarray:
    model = _get_model()
    vectors = model.encode(texts, batch_size=64, show_progress_bar=len(texts) > 100)
    faiss.normalize_L2(vectors)
    return vectors.astype(np.float32)


def _load_from_disk():
    global _index, _chunks, _metadata
    _index = faiss.read_index(INDEX_FILE)
    with open(METADATA_FILE, "rb") as f:
        _metadata = pickle.load(f)
    with open(CHUNKS_FILE, "rb") as f:
        _chunks = pickle.load(f)


def build_vector_store(force_rebuild: bool = False) -> int:
    global _index, _chunks, _metadata

    os.makedirs(FAISS_INDEX_DIR, exist_ok=True)

    if not force_rebuild and os.path.exists(INDEX_FILE) and os.path.exists(METADATA_FILE):
        logger.info("FAISS index da ton tai, dang load tu disk...")
        _load_from_disk()
        logger.info(f"Loaded {len(_chunks)} chunks.")
        return len(_chunks)

    logger.info("Load places tu MySQL...")
    places = get_all_places()
    if not places:
        logger.warning("Khong co data!")
        return 0

    logger.info(f"Tong {len(places)} places -> chunking...")
    all_chunks = chunk_all_places(places)
    texts    = [c["text"] for c in all_chunks]
    metadata = [c["metadata"] for c in all_chunks]

    logger.info(f"Tong {len(all_chunks)} chunks ({len(all_chunks)/len(places):.1f} chunks/place)")
    logger.info("Embedding chunks...")
    vectors = _embed(texts)

    dim = vectors.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)
    logger.info(f"FAISS index: {index.ntotal} vectors, dim={dim}")

    faiss.write_index(index, INDEX_FILE)
    with open(METADATA_FILE, "wb") as f:
        pickle.dump(metadata, f)
    with open(CHUNKS_FILE, "wb") as f:
        pickle.dump(texts, f)

    _index    = index
    _chunks   = texts
    _metadata = metadata

    logger.info(f"FAISS index saved to: {FAISS_INDEX_DIR}")
    return len(all_chunks)


def semantic_search(
    query: str,
    top_k: int = 5,
    city: str = None,
    place_type: str = None,
    chunk_types: List[str] = None
) -> List[Dict]:
    global _index, _chunks, _metadata

    if _index is None:
        _load_from_disk()

    if _index.ntotal == 0:
        return []

    query_vec = _embed([query])
    search_k = min(top_k * 8, _index.ntotal)
    scores, indices = _index.search(query_vec, search_k)

    seen_place_ids = {}

    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        meta = _metadata[idx]
        place_id = meta.get("place_db_id", "")

        if city and meta.get("city", "").lower() != city.lower():
            continue
        if place_type and place_type.lower() not in meta.get("place_type", "").lower():
            continue
        if chunk_types and meta.get("chunk_type") not in chunk_types:
            continue

        if place_id not in seen_place_ids or score > seen_place_ids[place_id]["score"]:
            seen_place_ids[place_id] = {
                "score": float(score),
                "meta": meta,
                "matched_chunk": _chunks[idx],
                "chunk_type": meta.get("chunk_type", "")
            }

    sorted_results = sorted(
        seen_place_ids.values(), key=lambda x: x["score"], reverse=True
    )[:top_k]

    results = []
    for r in sorted_results:
        meta = r["meta"]
        results.append({
            "id": meta.get("place_db_id"),
            "name": meta.get("name"),
            "city": meta.get("city"),
            "place_type": meta.get("place_type"),
            "address": meta.get("address"),
            "rating": meta.get("rating"),
            "price_range": meta.get("price_range"),
            "phone": meta.get("phone"),
            "opening_hours": meta.get("opening_hours"),
            "photo_url": meta.get("photo_url"),
            "similarity_score": round(r["score"], 3),
            "matched_chunk_type": r["chunk_type"],
            "matched_text": r["matched_chunk"][:150]
        })

    return results


def get_index_stats() -> Dict:
    global _index, _chunks, _metadata
    if _index is None:
        try:
            _load_from_disk()
        except Exception:
            return {"status": "not_built", "total_vectors": 0}

    type_counts = {}
    if _metadata:
        for m in _metadata:
            ct = m.get("chunk_type", "unknown")
            type_counts[ct] = type_counts.get(ct, 0) + 1

    return {
        "status": "ready",
        "total_vectors": _index.ntotal,
        "embedding_model": EMBEDDING_MODEL,
        "chunk_type_breakdown": type_counts,
    }
