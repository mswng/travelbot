#!/bin/bash
echo "=== TOURISM DATA PIPELINE ==="

# Tạo venv nếu chưa có
if [ ! -d "venv" ]; then
    python -m venv venv
    echo "✅ Đã tạo venv"
fi

# Kích hoạt venv đúng cách cho Git Bash trên Windows
source venv/Scripts/activate

# Cài packages
echo -e "\nCài packages..."
pip install -r requirements.txt

# Tạo thư mục data
mkdir -p data

# Bước 1: Crawl
echo -e "\n[1/3] Crawling OpenStreetMap..."
python crawler/openstreetmap.py

echo -e "\n[1b] Crawling Wikipedia..."
python crawler/wikipedia.py

echo -e "\n[1c] Crawling TripAdvisor..."
python crawler/tripadvisor.py

# Bước 2: Clean
echo -e "\n[2/3] Cleaning data..."
python data_processing/clean_data.py

# Bước 3: Insert MySQL
echo -e "\n[3/3] Inserting to MySQL..."
python data_processing/insert_mysql.py

echo -e "\n✅ PIPELINE HOÀN THÀNH!"