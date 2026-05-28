"""
insert_mysql.py
───────────────
Insert cleaned_data.csv vào MySQL (bảng places + photos).
Chạy: python data_processing/insert_mysql.py
"""

import pandas as pd
import mysql.connector
from mysql.connector import Error
import json
import ast
import os
from pathlib import Path

# ──────────────────────────────────────────────
# CONFIG — chỉnh lại thông tin kết nối MySQL
# ──────────────────────────────────────────────

DB_CONFIG = {
    'host':     'localhost',
    'port':     3306,
    'user':     'root',        # ← đổi thành user của bạn
    'password': 'Suong1265.',            # ← đổi thành password của bạn
    'database': 'ai_tour_guide',
    'charset':  'utf8mb4',
}

BASE_DIR  = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / 'data' / 'cleaned_data.csv'


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

def safe_str(val, max_len=None) -> str | None:
    if pd.isna(val) or str(val).strip() in ('', 'nan', 'None'):
        return None
    s = str(val).strip()
    if max_len:
        s = s[:max_len]
    return s


def safe_float(val) -> float | None:
    try:
        f = float(val)
        return f if not pd.isna(f) else None
    except Exception:
        return None


def safe_int(val) -> int | None:
    try:
        return int(float(val))
    except Exception:
        return None


def parse_photos(val) -> list:
    """Parse cột photos — có thể là list string hoặc JSON string"""
    if pd.isna(val) or str(val).strip() in ('', '[]', 'nan'):
        return []
    try:
        result = json.loads(str(val))
        if isinstance(result, list):
            return [str(u) for u in result if u]
    except Exception:
        pass
    try:
        result = ast.literal_eval(str(val))
        if isinstance(result, list):
            return [str(u) for u in result if u]
    except Exception:
        pass
    return []


# ──────────────────────────────────────────────
# INSERT PLACES
# ──────────────────────────────────────────────

INSERT_PLACE_SQL = """
    INSERT INTO places (
        place_id, name, description, address, city, country,
        latitude, longitude, rating, total_ratings,
        price_level, price_range, opening_hours,
        phone, website, place_type, source
    ) VALUES (
        %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s,
        %s, %s, %s,
        %s, %s, %s, %s
    )
    ON DUPLICATE KEY UPDATE
        name          = VALUES(name),
        description   = COALESCE(VALUES(description), description),
        address       = COALESCE(VALUES(address),     address),
        city          = COALESCE(VALUES(city),         city),
        latitude      = COALESCE(VALUES(latitude),     latitude),
        longitude     = COALESCE(VALUES(longitude),    longitude),
        rating        = COALESCE(VALUES(rating),       rating),
        total_ratings = COALESCE(VALUES(total_ratings),total_ratings),
        price_range   = COALESCE(VALUES(price_range),  price_range),
        opening_hours = COALESCE(VALUES(opening_hours),opening_hours),
        phone         = COALESCE(VALUES(phone),        phone),
        website       = COALESCE(VALUES(website),      website),
        updated_at    = CURRENT_TIMESTAMP
"""

INSERT_PHOTO_SQL = """
    INSERT IGNORE INTO photos (place_id, photo_url)
    VALUES (%s, %s)
"""


def insert_places(cursor, df: pd.DataFrame) -> tuple[int, int]:
    inserted = 0
    updated  = 0
    errors   = 0

    for _, row in df.iterrows():
        try:
            vals = (
                safe_str(row.get('place_id'),      255),
                safe_str(row.get('name'),          500),
                safe_str(row.get('description')),
                safe_str(row.get('address'),      1000),
                safe_str(row.get('city'),          200),
                safe_str(row.get('country'),       100) or 'Vietnam',
                safe_float(row.get('latitude')),
                safe_float(row.get('longitude')),
                safe_float(row.get('rating')),
                safe_int(row.get('total_ratings')) or 0,
                safe_int(row.get('price_level')),
                safe_str(row.get('price_range'),   200),
                safe_str(row.get('opening_hours')),
                safe_str(row.get('phone'),          50),
                safe_str(row.get('website'),       500),
                safe_str(row.get('place_type'),    100),
                safe_str(row.get('source'),         50),
            )

            cursor.execute(INSERT_PLACE_SQL, vals)

            if cursor.rowcount == 1:
                inserted += 1
            elif cursor.rowcount == 2:
                updated += 1

        except Error as e:
            errors += 1
            if errors <= 5:  # Chỉ in 5 lỗi đầu để không spam
                print(f"  ⚠️  Lỗi insert place '{row.get('name','?')}': {e}")

    return inserted, updated, errors


def insert_photos(cursor, df: pd.DataFrame) -> int:
    count = 0
    for _, row in df.iterrows():
        place_id = safe_str(row.get('place_id'), 255)
        if not place_id:
            continue

        photos = parse_photos(row.get('photos'))
        for url in photos:
            try:
                cursor.execute(INSERT_PHOTO_SQL, (place_id, url[:2000]))
                count += 1
            except Error:
                pass
    return count


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

def main():
    print("=" * 55)
    print("         INSERT MYSQL PIPELINE")
    print("=" * 55)

    # Load CSV
    print(f"\n📂 Load {DATA_FILE}...")
    if not DATA_FILE.exists():
        print(f"❌ Không tìm thấy {DATA_FILE}")
        print("   Hãy chạy clean_data.py trước!")
        return

    df = pd.read_csv(DATA_FILE, encoding='utf-8-sig')
    print(f"  → {len(df)} dòng")

    # Kết nối MySQL
    print(f"\n🔌 Kết nối MySQL ({DB_CONFIG['host']}:{DB_CONFIG['port']})...")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("  ✅ Kết nối thành công")
    except Error as e:
        print(f"  ❌ Kết nối thất bại: {e}")
        return

    try:
        # Tắt autocommit để dùng transaction
        conn.autocommit = False

        # ── Insert places ──
        print(f"\n📍 Insert places...")
        inserted, updated, errors = insert_places(cursor, df)
        print(f"  ✅ Inserted: {inserted} | Updated: {updated} | Errors: {errors}")

        # ── Insert photos ──
        print(f"\n🖼️  Insert photos...")
        photo_count = insert_photos(cursor, df)
        print(f"  ✅ {photo_count} photos")

        # Commit
        conn.commit()
        print(f"\n✅ Commit thành công!")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Lỗi, đã rollback: {e}")

    finally:
        cursor.close()
        conn.close()

    # Kiểm tra kết quả
    print("\n📊 Kiểm tra database...")
    try:
        conn2 = mysql.connector.connect(**DB_CONFIG)
        cur2  = conn2.cursor()

        cur2.execute("SELECT COUNT(*) FROM places")
        total = cur2.fetchone()[0]

        cur2.execute("SELECT city, COUNT(*) as cnt FROM places GROUP BY city ORDER BY cnt DESC")
        by_city = cur2.fetchall()

        cur2.execute("SELECT place_type, COUNT(*) as cnt FROM places GROUP BY place_type ORDER BY cnt DESC")
        by_type = cur2.fetchall()

        cur2.execute("SELECT COUNT(*) FROM photos")
        total_photos = cur2.fetchone()[0]

        print(f"\n  Tổng places : {total}")
        print(f"  Tổng photos : {total_photos}")
        print(f"\n  Theo city:")
        for city, cnt in by_city:
            print(f"    {city:<20}: {cnt}")
        print(f"\n  Theo place_type:")
        for ptype, cnt in by_type:
            print(f"    {ptype:<25}: {cnt}")

        cur2.close()
        conn2.close()

    except Error as e:
        print(f"  ⚠️ Không thể kiểm tra: {e}")


if __name__ == "__main__":
    main()