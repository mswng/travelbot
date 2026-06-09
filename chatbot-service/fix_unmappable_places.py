"""
Fix or delete places that cannot be displayed on OpenStreetMap.

This script only targets rows with missing/invalid latitude/longitude.
It does not delete valid coordinate rows.

Dry-run:
    python fix_unmappable_places.py

Verify with OSM and update found coordinates:
    python fix_unmappable_places.py --apply

Also delete rows that still cannot be geocoded:
    python fix_unmappable_places.py --apply --delete-unresolved --confirm-delete
"""

from __future__ import annotations

import argparse
import json
import re
import time
import unicodedata
from pathlib import Path
from typing import Dict, Iterable, Optional

import httpx
from sqlalchemy import text

from database import engine


NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
CACHE_FILE = Path(__file__).with_name("osm_geocode_cache.json")
USER_AGENT = "TravelBotUnmappableFixer/1.0 (student thesis data cleanup)"
REQUEST_DELAY_SECONDS = 1.1

VIETNAM_BBOX = {
    "min_lat": 8.0,
    "max_lat": 23.8,
    "min_lng": 102.0,
    "max_lng": 110.5,
}


def normalize_text(value: object) -> str:
    text_value = str(value or "").strip().lower()
    text_value = unicodedata.normalize("NFD", text_value)
    text_value = "".join(char for char in text_value if unicodedata.category(char) != "Mn")
    text_value = re.sub(r"[^\w\s]", " ", text_value)
    text_value = re.sub(r"\s+", " ", text_value)
    return text_value.strip()


def compact_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).strip(" ,")


def in_vietnam_bbox(lat: object, lng: object) -> bool:
    try:
        lat_value = float(lat)
        lng_value = float(lng)
    except (TypeError, ValueError):
        return False

    return (
        VIETNAM_BBOX["min_lat"] <= lat_value <= VIETNAM_BBOX["max_lat"]
        and VIETNAM_BBOX["min_lng"] <= lng_value <= VIETNAM_BBOX["max_lng"]
    )


def load_cache() -> Dict[str, Dict]:
    if not CACHE_FILE.exists():
        return {}

    return json.loads(CACHE_FILE.read_text(encoding="utf-8"))


def save_cache(cache: Dict[str, Dict]) -> None:
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def geocode(query: str, cache: Dict[str, Dict]) -> Dict:
    key = normalize_text(query)
    if key in cache:
        return cache[key]

    time.sleep(REQUEST_DELAY_SECONDS)
    try:
        response = httpx.get(
            NOMINATIM_URL,
            params={
                "q": query,
                "format": "jsonv2",
                "addressdetails": 1,
                "limit": 1,
                "countrycodes": "vn",
            },
            headers={"User-Agent": USER_AGENT},
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        result = data[0] if data else {}
    except Exception as exc:
        result = {"_error": str(exc)}

    cache[key] = result
    save_cache(cache)
    return result


def valid_osm_result(result: Dict) -> bool:
    if not result or result.get("_error"):
        return False

    address = result.get("address") or {}
    country_code = normalize_text(address.get("country_code"))
    return country_code == "vn" and in_vietnam_bbox(result.get("lat"), result.get("lon"))


def build_queries(place: Dict) -> list[str]:
    name = compact_text(place.get("name"))
    address = compact_text(place.get("address"))
    city = compact_text(place.get("city"))
    country = "Việt Nam"
    queries = []

    if name and city:
        queries.append(f"{name}, {city}, {country}")
    if name and address and normalize_text(address) != normalize_text(f"{city}, Vietnam"):
        queries.append(f"{name}, {address}, {country}")
    if address and city:
        queries.append(f"{address}, {city}, {country}")

    deduped = []
    seen = set()
    for query in queries:
        key = normalize_text(query)
        if key not in seen:
            seen.add(key)
            deduped.append(query)

    return deduped


def resolve_place(place: Dict, cache: Dict[str, Dict]) -> Optional[Dict]:
    for query in build_queries(place):
        result = geocode(query, cache)
        if valid_osm_result(result):
            return result

    return None


def fetch_unmappable(limit: Optional[int] = None) -> Iterable[Dict]:
    sql = """
        SELECT id, place_id, name, address, city, country, latitude, longitude, website, source
        FROM places
        WHERE latitude IS NULL
           OR longitude IS NULL
           OR latitude NOT BETWEEN 8.0 AND 23.8
           OR longitude NOT BETWEEN 102.0 AND 110.5
        ORDER BY id
    """
    if limit:
        sql += " LIMIT :limit"

    with engine.connect() as conn:
        return [dict(row) for row in conn.execute(text(sql), {"limit": limit} if limit else {}).mappings().all()]


def update_coordinates(conn, place_id: int, result: Dict) -> None:
    lat = result.get("lat")
    lon = result.get("lon")
    website = f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map=17/{lat}/{lon}"
    conn.execute(
        text("""
            UPDATE places
            SET latitude = :lat,
                longitude = :lon,
                website = :website,
                country = 'Vietnam'
            WHERE id = :id
        """),
        {
            "id": place_id,
            "lat": lat,
            "lon": lon,
            "website": website,
        },
    )


def delete_place(conn, place_id: int) -> None:
    conn.execute(text("DELETE FROM places WHERE id = :id"), {"id": place_id})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--delete-unresolved", action="store_true")
    parser.add_argument("--confirm-delete", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    if args.delete_unresolved and (not args.apply or not args.confirm_delete):
        raise SystemExit("--delete-unresolved requires --apply and --confirm-delete")

    cache = load_cache()
    places = list(fetch_unmappable(args.limit))
    resolved = []
    unresolved = []

    with engine.begin() as conn:
        for index, place in enumerate(places, 1):
            result = resolve_place(place, cache)
            if index % 25 == 0:
                print(f"Checked {index}/{len(places)} rows...")

            if result:
                resolved.append((place, result))
                if args.apply:
                    update_coordinates(conn, place["id"], result)
            else:
                unresolved.append(place)
                if args.apply and args.delete_unresolved:
                    delete_place(conn, place["id"])

    print("=== Unmappable places report ===")
    print(f"Mode: {'APPLY' if args.apply else 'DRY RUN'}")
    print(f"Rows checked: {len(places)}")
    print(f"Resolved coordinates: {len(resolved)}")
    print(f"Still unresolved: {len(unresolved)}")
    if args.apply and args.delete_unresolved:
        print(f"Deleted unresolved: {len(unresolved)}")

    if unresolved[:30]:
        print("\nSample unresolved:")
        for place in unresolved[:30]:
            print(f"- #{place['id']} {place.get('name')} | {place.get('address')} | {place.get('city')}")

    if resolved[:20]:
        print("\nSample resolved:")
        for place, result in resolved[:20]:
            print(f"- #{place['id']} {place.get('name')} -> {result.get('lat')}, {result.get('lon')}")

    if not args.apply:
        print("\nNo data was modified. Add --apply to update resolved coordinates.")


if __name__ == "__main__":
    main()
