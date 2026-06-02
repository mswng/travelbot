from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging
import uvicorn

from config import PORT
from vector_store import build_vector_store, semantic_search, get_index_stats
from rag_engine import chat
from database import search_places_by_keyword
from itinerary_engine import generate_itinerary, index_itineraries

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Tourism Chatbot API & Itinerary API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    places: List[Dict] = []
    sources_used: int = 0
    session_id: Optional[str] = None

class SearchRequest(BaseModel):
    keyword: str
    city: Optional[str] = None
    place_type: Optional[str] = None
    limit: Optional[int] = 10

class RebuildRequest(BaseModel):
    force: Optional[bool] = True

class ItineraryGenerateRequest(BaseModel):
    destination: str
    duration_days: int
    start_date: Optional[str] = ""
    preferences: Optional[str] = ""
    budget: Optional[str] = "trung bình"

class ItineraryItem(BaseModel):
    id: int
    title: str
    destination: str
    summary: str
    content: str

class ItineraryIndexRequest(BaseModel):
    itineraries: List[ItineraryItem]


@app.on_event("startup")
async def startup_event():
    logger.info("Khoi dong Tourism Chatbot Service...")
    try:
        count = build_vector_store(force_rebuild=False)
        logger.info(f"Vector store san sang: {count} chunks")
    except Exception as e:
        logger.error(f"Loi build vector store: {e}")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "tourism-chatbot"}


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """Endpoint chính - Spring Boot gọi vào đây."""
    try:
        history = [{"role": m.role, "content": m.content} for m in request.history]
        result = chat(message=request.message, history=history)
        return ChatResponse(
            answer=result["answer"],
            places=result["places"],
            sources_used=result["sources_used"],
            session_id=request.session_id
        )
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
def search_endpoint(request: SearchRequest):
    """Vector search - dùng để test RAG."""
    try:
        results = semantic_search(
            query=request.keyword,
            top_k=request.limit,
            city=request.city,
            place_type=request.place_type
        )
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/keyword")
def keyword_search_endpoint(request: SearchRequest):
    """MySQL keyword search."""
    try:
        results = search_places_by_keyword(
            keyword=request.keyword,
            city=request.city,
            place_type=request.place_type,
            limit=request.limit
        )
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/itinerary/generate")
def itinerary_generate(request: ItineraryGenerateRequest):
    """
    Spring Boot gọi endpoint này để AI tạo lịch trình.
    """
    try:
        result = generate_itinerary(
            destination=request.destination,
            duration_days=request.duration_days,
            start_date=request.start_date,
            preferences=request.preferences,
            budget=request.budget
        )
        return result
    except Exception as e:
        logger.error(f"Itinerary generate error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/itinerary/index")
def itinerary_index(request: ItineraryIndexRequest, background_tasks: BackgroundTasks):
    """
    Spring Boot gọi sau khi lưu lịch trình vào MySQL để sync vào FAISS.
    """
    items = [it.dict() for it in request.itineraries]
    background_tasks.add_task(index_itineraries, items)
    return {"message": f"Indexing s{len(items)} itineraries vào FAISS..."}



@app.post("/admin/rebuild-index")
def rebuild_index(request: RebuildRequest, background_tasks: BackgroundTasks):
    """Rebuild FAISS index - gọi sau khi thêm data mới."""
    background_tasks.add_task(build_vector_store, force_rebuild=request.force)
    return {"message": "Dang rebuild FAISS index o background..."}


@app.get("/admin/index-stats")
def index_stats():
    """Thong ke FAISS index."""
    return get_index_stats()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
