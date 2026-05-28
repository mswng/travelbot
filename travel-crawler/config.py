import os
from dotenv import load_dotenv

load_dotenv()

# MySQL config
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Suong1265.",
    "database": "ai_tour_guide",
    "charset": "utf8mb4"
}

CITY_BBOX = {
    "Ho Chi Minh City": (10.6, 106.5, 10.9, 106.9),
    "Hanoi":            (20.9, 105.7, 21.1, 106.0),
    "Da Nang":          (15.9, 108.1, 16.2, 108.3),
    "Hoi An":           (15.8, 108.2, 16.0, 108.4),
    "Nha Trang":        (12.2, 109.1, 12.3, 109.3),
    "Phu Quoc":         ( 9.8, 103.8, 10.5, 104.1),
    "Ha Long":          (20.9, 107.0, 21.1, 107.2),
    "Hue":              (16.4, 107.5, 16.6, 107.7),
    "Da Lat":           (11.9, 108.3, 12.0, 108.5),
    "Can Tho":          (10.0, 105.7, 10.1, 105.8),
}
# Loại địa điểm
PLACE_TYPES = [
    "tourist_attraction",
    "museum",
    "park",
    "amusement_park",
    "zoo",
    "aquarium",
    "art_gallery",
    "restaurant",
    "cafe",
    "lodging",
    "shopping_mall",
    "spa",
    "night_club",
    "bar"
]