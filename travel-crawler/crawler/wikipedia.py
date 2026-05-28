# crawler/enrich_wikipedia.py
import requests
import pandas as pd
from tqdm import tqdm
import time

def search_wikipedia(name: str, lang="vi") -> str:
    """Tìm và lấy tóm tắt Wikipedia cho 1 địa điểm"""
    try:
        # Bước 1: Tìm kiếm
        search_url = f"https://{lang}.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": name,
            "format": "json",
            "srlimit": 1,
        }
        resp = requests.get(search_url, params=params, timeout=10)
        results = resp.json().get("query", {}).get("search", [])
        if not results:
            return ""

        # Bước 2: Lấy extract
        page_title = results[0]["title"]
        extract_params = {
            "action": "query",
            "titles": page_title,
            "prop": "extracts",
            "exintro": True,
            "explaintext": True,
            "format": "json",
        }
        resp2 = requests.get(search_url, params=extract_params, timeout=10)
        pages = resp2.json().get("query", {}).get("pages", {})
        for page in pages.values():
            extract = page.get("extract", "")
            if extract:
                # Chỉ lấy đoạn đầu, tối đa 500 ký tự
                return extract[:500].strip()
    except:
        pass
    return ""

def enrich_description(input_csv="data/raw_osm.csv",
                        output_csv="data/raw_osm_enriched.csv"):
    df = pd.read_csv(input_csv, encoding="utf-8-sig")

    # Chỉ enrich những dòng chưa có description
    mask = df["description"].isna() | (df["description"] == "")
    targets = df[mask].head(500)  # Giới hạn 500 để không quá lâu

    print(f"Enriching {len(targets)} địa điểm từ Wikipedia...")

    for idx, row in tqdm(targets.iterrows(), total=len(targets)):
        desc = search_wikipedia(row["name"], lang="vi")
        if not desc:
            desc = search_wikipedia(row["name"], lang="en")
        if desc:
            df.at[idx, "description"] = desc
        time.sleep(0.3)  # Nhẹ nhàng với Wikipedia API

    df.to_csv(output_csv, index=False, encoding="utf-8-sig")
    print(f"✅ Đã enrich → {output_csv}")
    return df

if __name__ == "__main__":
    enrich_description()