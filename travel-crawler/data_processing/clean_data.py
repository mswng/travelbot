"""
clean_data.py
─────────────
Pipeline làm sạch data từ 3 nguồn: OpenStreetMap, Wikipedia, TripAdvisor
Chạy: python data_processing/clean_data.py
"""

import pandas as pd
import numpy as np
import json
import re
import os
from pathlib import Path

# Tính BASE_DIR từ vị trí file này — hoạt động đúng dù chạy từ bất kỳ thư mục nào
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'

# ──────────────────────────────────────────────
# 1. LOAD
# ──────────────────────────────────────────────

def load_all_data(data_dir=None) -> pd.DataFrame:
    if data_dir is None:
        data_dir = DATA_DIR
    dfs = []
    for fname in os.listdir(data_dir):
        if fname.startswith('raw_') and fname.endswith('.csv') and fname != 'raw_osm.csv':
            fpath = os.path.join(data_dir, fname)
            try:
                df = pd.read_csv(fpath, encoding='utf-8-sig')
                df['_source_file'] = fname  # track nguồn để debug
                print(f"  📄 {fname}: {len(df)} dòng")
                dfs.append(df)
            except Exception as e:
                print(f"  ❌ Lỗi đọc {fname}: {e}")

    if not dfs:
        raise ValueError("Không tìm thấy file raw data trong thư mục data/!")

    combined = pd.concat(dfs, ignore_index=True)
    print(f"\n  Tổng raw: {len(combined)} dòng")
    return combined


# ──────────────────────────────────────────────
# 2. CLEAN TEXT
# ──────────────────────────────────────────────

def clean_text(text) -> str:
    if pd.isna(text) or str(text).strip() == '':
        return ''
    text = str(text)
    # Xóa control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    # Chuẩn hóa khoảng trắng
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# ──────────────────────────────────────────────
# 3. REMOVE DUPLICATES
# ──────────────────────────────────────────────

def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """
    3 bước dedup theo mức độ chắc chắn giảm dần.
    KHÔNG drop rows thiếu tọa độ — TripAdvisor không có lat/lng.
    """
    before = len(df)

    # Bước 1: place_id trùng chính xác
    df = df.drop_duplicates(subset=['place_id'], keep='first')
    print(f"  Sau dedup place_id     : {len(df):>5} (xóa {before - len(df)})")

    # Bước 2: name + address giống nhau (normalize)
    df['_name_norm'] = df['name'].str.lower().str.strip()
    df['_addr_norm'] = df['address'].fillna('').str.lower().str.strip()
    before2 = len(df)
    df = df.drop_duplicates(subset=['_name_norm', '_addr_norm'], keep='first')
    print(f"  Sau dedup name+addr    : {len(df):>5} (xóa {before2 - len(df)})")

    # Bước 3: tọa độ gần nhau — CHỈ áp dụng cho rows CÓ tọa độ
    # Không drop rows thiếu lat/lng (TripAdvisor hợp lệ dù không có tọa độ)
    has_coords = df['latitude'].notna() & df['longitude'].notna()
    df.loc[has_coords, '_lat_round'] = df.loc[has_coords, 'latitude'].round(4)
    df.loc[has_coords, '_lng_round'] = df.loc[has_coords, 'longitude'].round(4)

    # Chỉ dedup trong nhóm có tọa độ
    with_coords    = df[has_coords].drop_duplicates(
        subset=['_name_norm', '_lat_round', '_lng_round'], keep='first'
    )
    without_coords = df[~has_coords]
    before3 = len(df)
    df = pd.concat([with_coords, without_coords], ignore_index=True)
    print(f"  Sau dedup tọa độ       : {len(df):>5} (xóa {before3 - len(df)})")

    # Cleanup cột tạm
    df = df.drop(columns=['_name_norm', '_addr_norm', '_lat_round', '_lng_round',
                           '_source_file'], errors='ignore')
    return df


# ──────────────────────────────────────────────
# 4. CLEAN RATING
# ──────────────────────────────────────────────

def clean_rating(val) -> float:
    try:
        r = float(val)
        if r > 5:        # Foursquare thang 0-10
            r = r / 2
        if 0 < r <= 5:   # 0 không hợp lệ (chưa có rating)
            return round(r, 1)
    except Exception:
        pass
    return None


# ──────────────────────────────────────────────
# 5. VALIDATE COORDINATES
# ──────────────────────────────────────────────

def validate_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Với rows CÓ tọa độ: kiểm tra nằm trong lãnh thổ Việt Nam.
    Rows KHÔNG có tọa độ: giữ lại (TripAdvisor hợp lệ).
    """
    # Vietnam bounding box: lat 8.5–23.5, lng 102–110
    has_coords = df['latitude'].notna() & df['longitude'].notna()

    valid_coords = (
        df['latitude'].between(8.5, 23.5) &
        df['longitude'].between(102.0, 110.0)
    )

    # Giữ: (có tọa độ VÀ tọa độ hợp lệ) HOẶC (không có tọa độ)
    keep_mask = (has_coords & valid_coords) | (~has_coords)

    before = len(df)
    df = df[keep_mask]
    removed = before - len(df)
    if removed:
        print(f"  Loại {removed} dòng có tọa độ ngoài Việt Nam")
    else:
        print(f"  Tất cả tọa độ hợp lệ")
    return df


# ──────────────────────────────────────────────
# 6. FILL MISSING DESCRIPTION
# ──────────────────────────────────────────────

def fill_missing_description(df: pd.DataFrame) -> pd.DataFrame:
    templates = {
        'tourist_attraction': '{name} là điểm tham quan nổi tiếng tại {city}, Việt Nam.',
        'restaurant':         '{name} là nhà hàng tại {city}, phục vụ các món ăn đặc sắc.',
        'museum':             '{name} là bảo tàng tại {city}, lưu giữ nhiều hiện vật lịch sử.',
        'park':               '{name} là công viên xanh mát tại {city}.',
        'cafe':               '{name} là quán cà phê tại {city}.',
        'hotel':              '{name} là khách sạn tại {city}.',
        'default':            '{name} là địa điểm du lịch tại {city}, Việt Nam.',
    }

    mask = df['description'].isna() | (df['description'].str.strip() == '')

    def gen_desc(row):
        tmpl = templates.get(str(row.get('place_type', '')), templates['default'])
        return tmpl.format(
            name=row.get('name', ''),
            city=row.get('city', 'Việt Nam')
        )

    df.loc[mask, 'description'] = df[mask].apply(gen_desc, axis=1)
    print(f"  Fill description cho {mask.sum()} dòng")
    return df


# ──────────────────────────────────────────────
# 7. CLEAN PHONE
# ──────────────────────────────────────────────

def clean_phone(phone) -> str:
    if pd.isna(phone):
        return ''
    return re.sub(r'[^\d+\-\s()]', '', str(phone)).strip()


# ──────────────────────────────────────────────
# 8. STANDARDIZE PLACE_TYPE
# ──────────────────────────────────────────────

PLACE_TYPE_MAP = {
    # OSM / Wikipedia có thể dùng tên khác
    'attraction':    'tourist_attraction',
    'tourism':       'tourist_attraction',
    'sight':         'tourist_attraction',
    'food':          'restaurant',
    'eating':        'restaurant',
    'dining':        'restaurant',
    'cafe':          'cafe',
    'coffee':        'cafe',
    'lodging':       'hotel',
    'accommodation': 'hotel',
    'nature':        'park',
    'garden':        'park',
}

def standardize_place_type(df: pd.DataFrame) -> pd.DataFrame:
    df['place_type'] = (
        df['place_type']
        .fillna('tourist_attraction')
        .str.lower()
        .str.strip()
        .map(lambda x: PLACE_TYPE_MAP.get(x, x))
    )
    return df


# ──────────────────────────────────────────────
# 9. STANDARDIZE CITY NAME
# ──────────────────────────────────────────────

CITY_NAME_MAP = {
    'ho chi minh':      'Ho Chi Minh City',
    'hcmc':             'Ho Chi Minh City',
    'saigon':           'Ho Chi Minh City',
    'tp hcm':           'Ho Chi Minh City',
    'tp. hcm':          'Ho Chi Minh City',
    'ha noi':           'Hanoi',
    'hà nội':           'Hanoi',
    'đà nẵng':          'Da Nang',
    'da nang':          'Da Nang',
    'hội an':           'Hoi An',
    'hoi an':           'Hoi An',
    'nha trang':        'Nha Trang',
    'phú quốc':         'Phu Quoc',
    'phu quoc':         'Phu Quoc',
    'hạ long':          'Ha Long',
    'ha long':          'Ha Long',
    'halong':           'Ha Long',
    'huế':              'Hue',
    'hue':              'Hue',
    'đà lạt':           'Da Lat',
    'da lat':           'Da Lat',
    'dalat':            'Da Lat',
    'cần thơ':          'Can Tho',
    'can tho':          'Can Tho',
}

def standardize_city(df: pd.DataFrame) -> pd.DataFrame:
    df['city'] = (
        df['city']
        .fillna('')
        .str.strip()
        .map(lambda x: CITY_NAME_MAP.get(x.lower(), x))
    )
    return df


# ──────────────────────────────────────────────
# MAIN PIPELINE
# ──────────────────────────────────────────────

def clean_pipeline(
    data_dir=None,
    output_file=None
):
    if data_dir is None:
        data_dir = DATA_DIR
    if output_file is None:
        output_file = DATA_DIR / 'cleaned_data.csv'
    print("=" * 55)
    print("         CLEAN DATA PIPELINE")
    print("=" * 55)

    # ── Load ──
    print("\n📂 [1/9] Load data...")
    df = load_all_data(data_dir)

    # ── Giữ cột cần thiết ──
    keep_cols = [
        'place_id', 'name', 'description', 'address', 'city', 'country',
        'latitude', 'longitude', 'rating', 'total_ratings', 'price_level',
        'price_range', 'opening_hours', 'phone', 'website',
        'place_type', 'source', 'photos', '_source_file',
    ]
    df = df[[c for c in keep_cols if c in df.columns]]

    # ── Clean text ──
    print("\n📝 [2/9] Clean text fields...")
    for col in ['name', 'description', 'address', 'opening_hours', 'price_range']:
        if col in df.columns:
            df[col] = df[col].apply(clean_text)

    # ── Chuẩn hóa city / place_type ──
    print("\n🏙️  [3/9] Chuẩn hóa city & place_type...")
    df = standardize_city(df)
    df = standardize_place_type(df)

    # ── Loại dòng không có tên ──
    before = len(df)
    df = df[df['name'].notna() & (df['name'].str.strip() != '')]
    print(f"\n🗑️  [4/9] Loại dòng không có tên: {before} → {len(df)}")

    # ── Remove duplicates ──
    print("\n🔄 [5/9] Xóa duplicate...")
    df = remove_duplicates(df)

    # ── Rating ── (bỏ qua — không có rating đáng tin cậy)
    print("\n⭐ [6/9] Bỏ qua rating...")
    df['rating'] = None

    # ── Clean phone ──
    print("\n📞 [7/9] Clean phone...")
    if 'phone' in df.columns:
        df['phone'] = df['phone'].apply(clean_phone)

    # ── Validate coordinates ──
    print("\n🗺️  [8/9] Validate tọa độ...")
    df = validate_coordinates(df)

    # ── Fill missing description ──
    print("\n📄 [9/9] Fill description còn thiếu...")
    df = fill_missing_description(df)

    # ── Finalize ──
    df = df.drop(columns=['_source_file'], errors='ignore')
    df = df.reset_index(drop=True)

    # ── Save ──
    os.makedirs(os.path.dirname(output_file) or '.', exist_ok=True)
    df.to_csv(output_file, index=False, encoding='utf-8-sig')

    # ── Báo cáo ──
    print(f"\n{'='*55}")
    print(f"✅ CLEAN XONG: {len(df)} địa điểm → {output_file}")
    print(f"\n📊 THỐNG KÊ:")
    print(f"\n  Theo city:")
    print(df['city'].value_counts().to_string())
    print(f"\n  Theo place_type:")
    print(df['place_type'].value_counts().to_string())
    print(f"\n  Theo source:")
    print(df['source'].value_counts().to_string())
    print(f"\n  Chất lượng data:")
    print(f"    Rating         : không sử dụng")
    print(f"    Có tọa độ      : {df['latitude'].notna().sum():>5} / {len(df)}")
    print(f"    Có phone       : {(df['phone'].fillna('') != '').sum():>5} / {len(df)}")
    print(f"    Có website     : {(df['website'].fillna('') != '').sum():>5} / {len(df)}")
    print(f"    Có opening hrs : {(df['opening_hours'].fillna('') != '').sum():>5} / {len(df)}")

    return df


if __name__ == "__main__":
    clean_pipeline()