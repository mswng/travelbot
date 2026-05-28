import time
import random
import json
import re
import pandas as pd
from tqdm import tqdm
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, NoSuchElementException,
    InvalidSessionIdException, WebDriverException
)
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import sys
sys.path.append('..')

CITY_ATTRACTION_URLS = {
    "Ho Chi Minh City": "https://www.tripadvisor.com/Attractions-g293925-Activities-Ho_Chi_Minh_City.html",
    "Hanoi":            "https://www.tripadvisor.com/Attractions-g293924-Activities-Hanoi.html",
    "Da Nang":          "https://www.tripadvisor.com/Attractions-g298082-Activities-Da_Nang.html",
    "Hoi An":           "https://www.tripadvisor.com/Attractions-g297908-Activities-Hoi_An_Quang_Nam_Province.html",
    "Nha Trang":        "https://www.tripadvisor.com/Attractions-g298085-Activities-Nha_Trang.html",
    "Phu Quoc":         "https://www.tripadvisor.com/Attractions-g737051-Activities-Phu_Quoc_Island.html",
    "Ha Long":          "https://www.tripadvisor.com/Attractions-g311304-Activities-Ha_Long.html",
    "Hue":              "https://www.tripadvisor.com/Attractions-g293926-Activities-Hue.html",
    "Da Lat":           "https://www.tripadvisor.com/Attractions-g293927-Activities-Da_Lat.html",
    "Can Tho":          "https://www.tripadvisor.com/Attractions-g303942-Activities-Can_Tho.html",
}

CITY_RESTAURANT_URLS = {
    "Ho Chi Minh City": "https://www.tripadvisor.com/Restaurants-g293925-Ho_Chi_Minh_City.html",
    "Hanoi":            "https://www.tripadvisor.com/Restaurants-g293924-Hanoi.html",
    "Da Nang":          "https://www.tripadvisor.com/Restaurants-g298082-Da_Nang.html",
    "Hoi An":           "https://www.tripadvisor.com/Restaurants-g297908-Hoi_An_Quang_Nam_Province.html",
    "Nha Trang":        "https://www.tripadvisor.com/Restaurants-g298085-Nha_Trang.html",
    "Phu Quoc":         "https://www.tripadvisor.com/Restaurants-g737051-Phu_Quoc_Island.html",
    "Ha Long":          "https://www.tripadvisor.com/Restaurants-g311304-Ha_Long.html",
    "Hue":              "https://www.tripadvisor.com/Restaurants-g293926-Hue.html",
    "Da Lat":           "https://www.tripadvisor.com/Restaurants-g293927-Da_Lat.html",
    "Can Tho":          "https://www.tripadvisor.com/Restaurants-g303942-Can_Tho.html",
}

def random_delay(min_s=2, max_s=5):
    time.sleep(random.uniform(min_s, max_s))


# ──────────────────────────────────────────────
# DRIVER SETUP & HEALTH CHECK
# ──────────────────────────────────────────────

def create_driver(headless=True) -> webdriver.Chrome:
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--lang=en-US")
    options.add_argument("--disable-web-security")
    options.add_argument("--allow-running-insecure-content")
    # ✅ FIX: Tăng page load timeout để tránh treo vô hạn
    options.add_argument("--page-load-strategy=eager")

    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    prefs = {
        "profile.default_content_setting_values.notifications": 2,
        "credentials_enable_service": False,
    }
    options.add_experimental_option("prefs", prefs)

    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    ]
    options.add_argument(f"user-agent={random.choice(user_agents)}")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    # ✅ FIX: Đặt timeout hợp lý — tránh treo 120s
    driver.set_page_load_timeout(30)
    driver.set_script_timeout(20)

    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": """
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1,2,3]});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US','en']});
            window.chrome = {runtime: {}};
        """
    })
    return driver


def is_driver_alive(driver) -> bool:
    """Kiểm tra xem driver có còn sống không"""
    try:
        _ = driver.current_url  # sẽ throw nếu session chết
        return True
    except Exception:
        return False


def safe_get(driver, url: str, retries=2) -> bool:
    """
    Mở URL an toàn với retry.
    Trả về True nếu thành công, False nếu thất bại.
    """
    for attempt in range(retries):
        try:
            driver.get(url)
            return True
        except TimeoutException:
            print(f"    ⏱️ Page load timeout (attempt {attempt+1}/{retries}): {url}")
            try:
                driver.execute_script("window.stop();")  # Dừng load, dùng những gì đã có
            except Exception:
                pass
            return True  # Vẫn dùng partial page
        except (InvalidSessionIdException, WebDriverException) as e:
            if "invalid session id" in str(e).lower() or "session deleted" in str(e).lower():
                print(f"    💀 Session chết tại attempt {attempt+1}")
                return False
            print(f"    ❌ WebDriverException: {e}")
            return False
    return False


# ──────────────────────────────────────────────
# LẤY DANH SÁCH LINK TỪNG ĐỊA ĐIỂM
# ──────────────────────────────────────────────

# Geo-code của 10 thành phố Việt Nam đang crawl
# → Lọc ra các URL không thuộc các thành phố này
VALID_GEO_CODES = {
    'g293925',  # Ho Chi Minh City
    'g293924',  # Hanoi
    'g298082',  # Da Nang
    'g297908',  # Hoi An
    'g298085',  # Nha Trang
    'g737051',  # Phu Quoc
    'g311304',  # Ha Long
    'g293926',  # Hue
    'g293927',  # Da Lat
    'g303942',  # Can Tho
}

def _clean_url(href: str) -> str:
    """Strip query string và fragment (#...) khỏi URL."""
    return href.split('?')[0].split('#')[0]


def _is_valid_place_url(href: str) -> bool:
    """
    Kiểm tra href có phải URL địa điểm hợp lệ không.
    Loại bỏ:
      - AttractionProductReview  (trang tour/sản phẩm)
      - URL lỗi chính tả: Reviewss, Reviewws, Revieews, ...
      - URL không thuộc 10 thành phố Việt Nam đang crawl
    """
    # Làm sạch fragment (#REVIEWS, #...) và query string trước khi check
    clean = _clean_url(href)

    # Loại URL tour/sản phẩm
    if 'AttractionProduct' in clean:
        return False

    # Loại MỌI biến thể lỗi chính tả của "Reviews":
    # Reviewss, Reviewws, Revieews, Reviewees...
    # Sau "Review" chỉ được là '-' hoặc hết chuỗi, không được có chữ cái nào
    if re.search(r'Reviews?[a-z]+', clean):
        return False

    # Chỉ nhận Attraction_Review và Restaurant_Review
    if not any(x in clean for x in ['Attraction_Review', 'Restaurant_Review']):
        return False

    # Chỉ nhận URL thuộc các thành phố đang crawl
    if not any(geo in clean for geo in VALID_GEO_CODES):
        return False

    return True


def get_place_links(driver, list_url: str, max_pages=5) -> list:
    links = []
    current_url = list_url

    for page_num in range(max_pages):
        print(f"    📄 Trang {page_num + 1}: {current_url}")

        if not is_driver_alive(driver):
            print("    💀 Driver chết khi lấy links, dừng pagination")
            break

        try:
            ok = safe_get(driver, current_url)
            if not ok:
                break

            time.sleep(random.uniform(4, 6))

            for scroll in range(5):
                driver.execute_script(f"window.scrollTo(0, {scroll * 500});")
                time.sleep(0.8)

            time.sleep(2)
            soup = BeautifulSoup(driver.page_source, 'html.parser')

            found_links = set()

            # Pattern 1: Tất cả thẻ <a>
            for a in soup.find_all('a', href=True):
                href = a['href']
                if _is_valid_place_url(href):
                    base = "https://www.tripadvisor.com" + href if href.startswith('/') else href
                    found_links.add(_clean_url(base))

            # Pattern 2: Tìm theo data-automation attribute
            for el in soup.find_all(attrs={"data-automation": True}):
                a = el.find('a', href=True)
                if a:
                    href = a['href']
                    if _is_valid_place_url(href):
                        base = "https://www.tripadvisor.com" + href if href.startswith('/') else href
                        found_links.add(_clean_url(base))

            # Pattern 3: Tìm trong JSON embedded
            scripts = soup.find_all('script', type='application/json')
            for script in scripts:
                try:
                    text = script.string or ''
                    urls = re.findall(r'/(?:Attraction|Restaurant)_Review[^"\'\\s]+', text)
                    for u in urls:
                        if _is_valid_place_url(u):
                            found_links.add("https://www.tripadvisor.com" + _clean_url(u))
                except Exception:
                    pass

            links.extend(found_links)
            links = list(set(links))
            print(f"    → Tìm được {len(links)} links tổng cộng")

            if len(found_links) == 0:
                print(f"    ⚠️  Page title: {driver.title}")
                if any(x in driver.page_source.lower() for x in ['captcha', 'robot', 'blocked', 'access denied']):
                    print("    🚫 BỊ CAPTCHA/BLOCK! Đang chờ 30 giây...")
                    time.sleep(30)
                break

            next_url = None
            for a in soup.find_all('a', href=True):
                aria = a.get('aria-label', '').lower()
                text = a.get_text().strip().lower()
                if 'next' in aria or 'next' in text:
                    href = a['href']
                    next_url = "https://www.tripadvisor.com" + href if href.startswith('/') else href
                    break

            if next_url:
                current_url = next_url
            else:
                print("    ⛔ Không còn trang tiếp theo")
                break

        except KeyboardInterrupt:
            print("\n⚠️ Dừng bởi người dùng")
            break
        except Exception as e:
            print(f"    ❌ Lỗi: {e}")
            break

    return list(set(links))


# ──────────────────────────────────────────────
# PARSE CHI TIẾT 1 ĐỊA ĐIỂM
# ──────────────────────────────────────────────

def parse_detail_page(driver, url: str, city: str, place_type: str) -> dict | None:
    try:
        # ✅ FIX: Kiểm tra session trước khi dùng
        if not is_driver_alive(driver):
            print(f"    💀 Driver không còn sống, bỏ qua: {url}")
            return None

        ok = safe_get(driver, url)
        if not ok:
            return None

        random_delay(2, 3.5)

        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "h1"))
            )
        except TimeoutException:
            # Vẫn thử parse những gì có
            print(f"    ⚠️ Không tìm thấy h1 sau 15s: {url}")

        driver.execute_script("window.scrollTo(0, 600);")
        random_delay(0.5, 1)

        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # ── Tên ──
        name = ""
        h1 = soup.find('h1')
        if h1:
            name = h1.get_text(strip=True)
        if not name:
            return None

        # ── Mô tả ──
        description = ""
        desc_selectors = [
            {'data-automation': 'WebPresentation_PoiDescriptionSection'},
            {'class': re.compile(r'biGQs|description|AboutSection')},
        ]
        for sel in desc_selectors:
            desc_tag = soup.find(attrs=sel)
            if desc_tag:
                description = desc_tag.get_text(separator=' ', strip=True)[:1000]
                break

        if not description:
            reviews = soup.find_all('q', class_=re.compile(r'IRfmm|partial_entry'))
            if reviews:
                description = " | ".join([r.get_text(strip=True)[:200] for r in reviews[:3]])

        # ── Rating ──
        rating = None
        rating_tag = soup.find('span', class_=re.compile(r'ZDEqb|rating'))
        if not rating_tag:
            ld_json = soup.find('script', type='application/ld+json')
            if ld_json:
                try:
                    ld = json.loads(ld_json.string)
                    if isinstance(ld, list):
                        ld = ld[0]
                    agg = ld.get('aggregateRating', {})
                    rating = float(agg.get('ratingValue', 0)) or None
                except Exception:
                    pass
        else:
            try:
                rating = float(rating_tag.get_text(strip=True).replace(',', '.'))
            except Exception:
                pass

        # ── Địa chỉ ──
        address = ""
        addr_selectors = [
            {'data-automation': 'map-pin-fill'},
            {'class': re.compile(r'biGQs.*address|UdUss|BLHKP')},
            {'class': re.compile(r'address')},
        ]
        for sel in addr_selectors:
            addr_tag = soup.find(attrs=sel)
            if addr_tag:
                address = addr_tag.get_text(separator=', ', strip=True)
                break

        if not address:
            try:
                ld_json = soup.find('script', type='application/ld+json')
                if ld_json:
                    ld = json.loads(ld_json.string)
                    if isinstance(ld, list): ld = ld[0]
                    loc = ld.get('address', {})
                    parts = [
                        loc.get('streetAddress', ''),
                        loc.get('addressLocality', ''),
                        loc.get('addressRegion', ''),
                        loc.get('addressCountry', '')
                    ]
                    address = ', '.join([p for p in parts if p])
            except Exception:
                pass

        # ── Giờ mở cửa ──
        opening_hours = ""
        hours_tag = soup.find(attrs={'data-automation': re.compile(r'hour|Hours', re.I)})
        if not hours_tag:
            hours_tag = soup.find('div', class_=re.compile(r'hours|opening', re.I))
        if hours_tag:
            opening_hours = hours_tag.get_text(separator='\n', strip=True)[:500]

        if not opening_hours:
            try:
                ld_json = soup.find('script', type='application/ld+json')
                if ld_json:
                    ld = json.loads(ld_json.string)
                    if isinstance(ld, list): ld = ld[0]
                    oh = ld.get('openingHours', [])
                    if oh:
                        opening_hours = json.dumps(oh, ensure_ascii=False)
            except Exception:
                pass

        # ── Giá vé ──
        price_range = ""
        for tag in soup.find_all(string=re.compile(r'Free|Miễn phí|\$|₫|VND|ticket|admission', re.I)):
            parent = tag.parent
            if parent and len(tag) < 200:
                price_range = tag.strip()
                break

        if not price_range:
            try:
                ld_json = soup.find('script', type='application/ld+json')
                if ld_json:
                    ld = json.loads(ld_json.string)
                    if isinstance(ld, list): ld = ld[0]
                    price_range = str(ld.get('priceRange', ''))
            except Exception:
                pass

        # ── Phone & Website ──
        phone = ""
        website = ""
        phone_tag = soup.find('a', href=re.compile(r'^tel:'))
        if phone_tag:
            phone = phone_tag.get('href', '').replace('tel:', '').strip()

        web_tag = soup.find('a', attrs={'data-automation': re.compile(r'website', re.I)})
        if not web_tag:
            web_tag = soup.find('a', string=re.compile(r'website|Official', re.I))
        if web_tag:
            website = web_tag.get('href', '')

        # ── Photos ──
        photos = []
        img_tags = soup.find_all('img', src=re.compile(r'dynamic-media|media-cdn.tripadvisor'))
        for img in img_tags[:5]:
            src = img.get('src', '')
            if src and 'photo' in src.lower():
                photos.append(src)

        place_id_match = re.search(r'-(d\d+)-', url)
        place_id = f"ta_{place_id_match.group(1)}" if place_id_match else f"ta_{hash(url)}"

        return {
            'place_id':      place_id,
            'name':          name,
            'description':   description,
            'address':       address or f"{city}, Vietnam",
            'city':          city,
            'country':       'Vietnam',
            'latitude':      None,
            'longitude':     None,
            'rating':        rating,
            'total_ratings': 0,
            'price_level':   None,
            'price_range':   price_range,
            'opening_hours': opening_hours,
            'phone':         phone,
            'website':       website,
            'place_type':    place_type,
            'source':        'tripadvisor',
            'photos':        photos,
            'source_url':    url,
        }

    except (InvalidSessionIdException, WebDriverException) as e:
        # ✅ FIX: Bắt riêng lỗi session để caller biết cần restart
        if "invalid session id" in str(e).lower() or "session deleted" in str(e).lower():
            print(f"    💀 Session died parsing {url}")
            raise  # Re-raise để caller xử lý restart
        print(f"    ❌ WebDriverException: {e}")
        return None
    except TimeoutException:
        print(f"    ⚠️ Timeout: {url}")
        return None
    except Exception as e:
        print(f"    ❌ Lỗi parse {url}: {e}")
        return None


# ──────────────────────────────────────────────
# ENRICH TỌA ĐỘ
# ──────────────────────────────────────────────

def enrich_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    try:
        import googlemaps
        from config import GOOGLE_MAPS_API_KEY
        gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
    except Exception:
        print("  ⚠️ Bỏ qua enrich tọa độ (không có Google Maps key)")
        return df

    mask = df['latitude'].isna()
    print(f"  Geocoding {mask.sum()} địa điểm thiếu tọa độ...")

    for idx, row in df[mask].iterrows():
        query = f"{row['name']}, {row['address']}"
        try:
            result = gmaps.geocode(query)
            if result:
                loc = result[0]['geometry']['location']
                df.at[idx, 'latitude'] = loc['lat']
                df.at[idx, 'longitude'] = loc['lng']
            time.sleep(0.05)
        except Exception:
            pass

    return df


# ──────────────────────────────────────────────
# CHECKPOINT + AUTO-RESTART DRIVER
# ──────────────────────────────────────────────

def crawl_tripadvisor_with_checkpoint(
    checkpoint_file='data/checkpoint_ta.json',
    output_file='data/raw_tripadvisor.csv',
    max_pages_per_city=5,
    headless=True
):
    import os

    all_data = {}
    visited_urls = set()

    if os.path.exists(checkpoint_file):
        with open(checkpoint_file, 'r', encoding='utf-8') as f:
            checkpoint = json.load(f)
            all_data = checkpoint.get('data', {})
            visited_urls = set(checkpoint.get('visited_urls', []))
        print(f"📂 Resume từ checkpoint: {len(all_data)} records, {len(visited_urls)} URLs đã thăm")

    def save_checkpoint():
        os.makedirs(os.path.dirname(checkpoint_file) or '.', exist_ok=True)
        with open(checkpoint_file, 'w', encoding='utf-8') as f:
            json.dump({
                'data': all_data,
                'visited_urls': list(visited_urls)
            }, f, ensure_ascii=False)
        print(f"  💾 Checkpoint saved: {len(all_data)} records")

    # ✅ FIX: Driver được quản lý ở đây, có thể restart
    driver = create_driver(headless=headless)

    def restart_driver():
        nonlocal driver
        print("  🔄 Đang restart ChromeDriver...")
        try:
            driver.quit()
        except Exception:
            pass
        time.sleep(3)
        driver = create_driver(headless=headless)
        print("  ✅ Driver mới đã sẵn sàng")

    try:
        # Bước 1: Thu thập tất cả URLs cần crawl
        print("\n🔍 Thu thập URLs từ tất cả thành phố...")
        all_urls = {}

        for city, url in CITY_ATTRACTION_URLS.items():
            print(f"\n🏛️  Attractions - {city}")
            if not is_driver_alive(driver):
                restart_driver()
            links = get_place_links(driver, url, max_pages=max_pages_per_city)
            for l in links:
                all_urls[l] = (city, 'tourist_attraction')

        for city, url in CITY_RESTAURANT_URLS.items():
            print(f"\n🍜  Restaurants - {city}")
            if not is_driver_alive(driver):
                restart_driver()
            links = get_place_links(driver, url, max_pages=max_pages_per_city)
            for l in links:
                all_urls[l] = (city, 'restaurant')

        pending = [(u, c, t) for u, (c, t) in all_urls.items() if u not in visited_urls]
        print(f"\n📋 Tổng: {len(all_urls)} URLs | Còn lại: {len(pending)} chưa crawl")

        # Bước 2: Crawl từng URL với auto-restart
        consecutive_errors = 0  # Đếm lỗi liên tiếp

        for i, (url, city, ptype) in enumerate(tqdm(pending, desc="Crawling")):
            # ✅ FIX: Kiểm tra driver trước mỗi request
            if not is_driver_alive(driver):
                restart_driver()
                consecutive_errors = 0

            try:
                detail = parse_detail_page(driver, url, city, ptype)
                visited_urls.add(url)
                consecutive_errors = 0  # Reset khi thành công

                if detail:
                    all_data[detail['place_id']] = detail

                random_delay(1.5, 3)

            except (InvalidSessionIdException, WebDriverException) as e:
                # ✅ FIX: Session chết → restart ngay
                print(f"\n  💀 Session chết tại URL #{i}: {url}")
                print(f"  🔄 Restart driver và tiếp tục...")
                visited_urls.add(url)  # Skip URL này để không bị loop
                restart_driver()
                consecutive_errors += 1
                time.sleep(5)

            except KeyboardInterrupt:
                print("\n⚠️ Người dùng dừng. Đang lưu checkpoint...")
                save_checkpoint()
                return pd.DataFrame(list(all_data.values()))

            except Exception as e:
                print(f"\n  ❌ Lỗi không xác định: {e}")
                visited_urls.add(url)
                consecutive_errors += 1

            # ✅ FIX: Nếu lỗi quá nhiều lần liên tiếp, nghỉ dài hơn
            if consecutive_errors >= 5:
                print(f"\n  ⚠️ {consecutive_errors} lỗi liên tiếp! Nghỉ 60 giây...")
                time.sleep(60)
                restart_driver()
                consecutive_errors = 0

            # Lưu checkpoint mỗi 50 URLs
            if (i + 1) % 50 == 0:
                save_checkpoint()

    finally:
        try:
            driver.quit()
        except Exception:
            pass
        save_checkpoint()

    df = pd.DataFrame(list(all_data.values()))
    df = enrich_coordinates(df)

    os.makedirs(os.path.dirname(output_file) or '.', exist_ok=True)
    df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"\n✅ Hoàn thành: {len(df)} records → {output_file}")

    return df


if __name__ == "__main__":
    crawl_tripadvisor_with_checkpoint(
        checkpoint_file='data/checkpoint_ta.json',
        output_file='data/raw_tripadvisor.csv',
        max_pages_per_city=5,
        headless=False
    )