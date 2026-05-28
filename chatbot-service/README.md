# Tourism Chatbot Service
FastAPI + Ollama + FAISS + Field-based Chunking

## Architecture
```
User → Spring Boot :8080 → FastAPI :8001 → Ollama :11434
                                  ↓
                           FAISS (local disk)
                                  ↑
                            MySQL (places)
```

## Chunking Strategy
Mỗi place → 3-5 chunks theo field:
- **identity**:    tên + loại + thành phố + rating
- **location**:    địa chỉ đầy đủ
- **description**: mô tả (sliding window 300 chars, overlap 50)
- **practical**:   giờ mở cửa + giá + SĐT

## Setup

### 1. Cài Ollama + model
```bash
ollama pull qwen2:7b
```

### 2. Cài dependencies
```bash
pip install -r requirements.txt
```

### 3. Sửa .env
```
DB_PASSWORD=your_mysql_password
```

### 4. Chạy
```bash
python main.py
```

## Test
```bash
python test_chatbot.py        # Auto test
python test_chatbot.py chat   # Interactive chat
```

## FAISS Index
- Lưu tại `./faiss_index/`
- Tự động build lần đầu từ MySQL
- Rebuild khi data thay đổi: `POST /admin/rebuild-index`
