"""
Test chatbot độc lập - chạy: python test_chatbot.py
Không cần Spring Boot, chỉ cần MySQL + Ollama đang chạy.
"""
import sys
from vector_store import build_vector_store, semantic_search
from rag_engine import chat
from database import get_all_places, search_places_by_keyword

def test_database():
    print("\n" + "="*50)
    print("TEST 1: Kết nối MySQL")
    print("="*50)
    places = get_all_places()
    print(f"✅ Tổng số địa điểm: {len(places)}")
    if places:
        p = places[0]
        print(f"   Mẫu: {p.get('name')} | {p.get('city')} | Rating: {p.get('rating')}")


def test_vector_store():
    print("\n" + "="*50)
    print("TEST 2: Build Vector Store")
    print("="*50)
    count = build_vector_store(force_rebuild=False)
    print(f"✅ Vector store: {count} documents")


def test_semantic_search():
    print("\n" + "="*50)
    print("TEST 3: Semantic Search")
    print("="*50)
    queries = [
        "nhà hàng hải sản ngon",
        "cafe view đẹp",
        "địa điểm tham quan nổi tiếng",
    ]
    for q in queries:
        results = semantic_search(q, top_k=3)
        print(f"\nQuery: '{q}'")
        for r in results:
            print(f"  → {r.get('name')} ({r.get('city')}) | score: {r.get('similarity_score')}")


def test_keyword_search():
    print("\n" + "="*50)
    print("TEST 4: Keyword Search (MySQL)")
    print("="*50)
    results = search_places_by_keyword("cafe", limit=3)
    for r in results:
        print(f"  → {r.get('name')} | {r.get('city')}")


def test_chat():
    print("\n" + "="*50)
    print("TEST 5: Chat với RAG")
    print("="*50)
    questions = [
        "Gợi ý cho tôi vài nhà hàng ngon ở Hà Nội",
        "Có quán cafe nào view đẹp không?",
        "Tôi muốn đi du lịch Đà Nẵng, nên đến đâu?",
    ]
    history = []
    for q in questions:
        print(f"\n👤 User: {q}")
        result = chat(message=q, history=history)
        print(f"🤖 Bot: {result['answer'][:300]}...")
        print(f"   (Dùng {result['sources_used']} nguồn)")
        history.append({"role": "user", "content": q})
        history.append({"role": "assistant", "content": result["answer"]})


def interactive_chat():
    """Chat trực tiếp trên terminal."""
    print("\n" + "="*50)
    print("INTERACTIVE CHAT (gõ 'quit' để thoát)")
    print("="*50)
    history = []
    while True:
        try:
            user_input = input("\n👤 Bạn: ").strip()
            if user_input.lower() in ("quit", "exit", "q"):
                break
            if not user_input:
                continue
            result = chat(message=user_input, history=history)
            print(f"\n🤖 Bot: {result['answer']}")
            if result["places"]:
                print(f"   [Tìm thấy {result['sources_used']} địa điểm liên quan]")
            history.append({"role": "user", "content": user_input})
            history.append({"role": "assistant", "content": result["answer"]})
        except KeyboardInterrupt:
            break


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "chat":
        # python test_chatbot.py chat → chạy interactive mode
        test_database()
        test_vector_store()
        interactive_chat()
    else:
        # python test_chatbot.py → chạy tất cả test
        test_database()
        test_vector_store()
        test_semantic_search()
        test_keyword_search()
        test_chat()
        print("\n✅ Tất cả test hoàn thành!")
