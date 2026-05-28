import requests
import pandas as pd
import time
from tqdm import tqdm
import os

# Nominatim - API chính thức của OpenStreetMap, free, không cần key
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

CITIES = [
    "Ho Chi Minh City, Vietnam",
    "Hanoi, Vietnam",
    "Da Nang, Vietnam",
    "Hoi An, Vietnam",
    "Nha Trang, Vietnam",
    "Phu Quoc, Vietnam",
    "Ha Long, Vietnam",
    "Hue, Vietnam",
    "Da Lat, Vietnam",
    "Can Tho, Vietnam",
]

PLACE_TYPES = [
    "tourism",
    "museum",
    "hotel",
    "restaurant",
    "cafe",
    "bar",
    "park",
    "attraction",
    "gallery",
    "monument",
    "ruins",
    "beach",
    "mall",
    "zoo",
]

HEADERS = {
    "User-Agent": "TourismChatbot/1.0 (research project)"
}

def search_places(city: str, place_type: str) -> list:
    params = {
        "q":              f"{place_type} in {city}",
        "format":         "json",
        "addressdetails": 1,
        "extratags":      1,
        "limit":          50,
        "accept-language": "vi",
    }
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params=params,
            headers=HEADERS,
            timeout=30
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  Lỗi: {e}")
        return []

def parse_place(item: dict, city: str, place_type: str) -> dict | None:
    name = (
        item.get("name") or
        item.get("display_name", "").split(",")[0]
    )
    if not name or len(name) < 2:
        return None

    address_detail = item.get("address") or {}      # ← thêm or {}
    extra = item.get("extratags") or {}              # ← thêm or {}

    # Ghép địa chỉ
    addr_parts = [
        address_detail.get("house_number", ""),
        address_detail.get("road", ""),
        address_detail.get("suburb", ""),
        address_detail.get("city", city),
        address_detail.get("country", "Vietnam"),
    ]
    address = ", ".join([p for p in addr_parts if p])

    fee = extra.get("fee", "")
    if fee == "no":
        price_range = "Miễn phí"
    elif fee == "yes":
        price_range = extra.get("charge", "Có tính phí")
    else:
        price_range = ""

    return {
        "place_id":      f"osm_{item['osm_type']}_{item['osm_id']}",
        "name":          name,
        "description":   extra.get("description") or extra.get("wikipedia") or "",
        "address":       address,
        "city":          city.replace(", Vietnam", ""),
        "country":       "Vietnam",
        "latitude":      float(item.get("lat", 0)),
        "longitude":     float(item.get("lon", 0)),
        "rating":        None,
        "total_ratings": 0,
        "price_level":   None,
        "price_range":   price_range,
        "opening_hours": extra.get("opening_hours", ""),
        "phone":         extra.get("phone", ""),
        "website":       extra.get("website", ""),
        "place_type":    place_type,
        "source":        "openstreetmap",
        "photos":        [],
    }
    name = (
        item.get("name") or
        item.get("display_name", "").split(",")[0]
    )
    if not name or len(name) < 2:
        return None

    address_detail = item.get("address", {})
    extra = item.get("extratags", {})

    # Ghép địa chỉ
    addr_parts = [
        address_detail.get("house_number", ""),
        address_detail.get("road", ""),
        address_detail.get("suburb", ""),
        address_detail.get("city", city),
        address_detail.get("country", "Vietnam"),
    ]
    address = ", ".join([p for p in addr_parts if p])

    # Giờ mở cửa
    opening_hours = extra.get("opening_hours", "")

    # Giá vé
    fee = extra.get("fee", "")
    if fee == "no":
        price_range = "Miễn phí"
    elif fee == "yes":
        price_range = extra.get("charge", "Có tính phí")
    else:
        price_range = ""

    # Mô tả
    description = (
        extra.get("description") or
        extra.get("wikipedia") or
        ""
    )

    return {
        "place_id":      f"osm_{item['osm_type']}_{item['osm_id']}",
        "name":          name,
        "description":   description,
        "address":       address,
        "city":          city.replace(", Vietnam", ""),
        "country":       "Vietnam",
        "latitude":      float(item.get("lat", 0)),
        "longitude":     float(item.get("lon", 0)),
        "rating":        None,
        "total_ratings": 0,
        "price_level":   None,
        "price_range":   price_range,
        "opening_hours": opening_hours,
        "phone":         extra.get("phone", ""),
        "website":       extra.get("website", ""),
        "place_type":    place_type,
        "source":        "openstreetmap",
        "photos":        [],
    }

def crawl_nominatim(output_file="data/raw_osm.csv"):
    all_places = {}

    for city in CITIES:
        print(f"\n🏙️  {city}")

        for place_type in tqdm(PLACE_TYPES, desc="  Querying"):
            results = search_places(city, place_type)

            for item in results:
                parsed = parse_place(item, city, place_type)
                if parsed:
                    pid = parsed["place_id"]
                    if pid not in all_places:
                        all_places[pid] = parsed

            # Nominatim yêu cầu delay ít nhất 1s giữa các request
            time.sleep(1)

        print(f"  Tích lũy: {len(all_places)} địa điểm")

    os.makedirs("data", exist_ok=True)
    df = pd.DataFrame(list(all_places.values()))
    df.to_csv(output_file, index=False, encoding="utf-8-sig")
    print(f"\n✅ OpenStreetMap (Nominatim): {len(df)} địa điểm → {output_file}")
    return df

if __name__ == "__main__":
    crawl_nominatim()