# debug_rating.py — đặt ở thư mục gốc project
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import json, re, time

url = "https://www.tripadvisor.com/Attraction_Review-g293925-d456403-Reviews-War_Remnants_Museum-Ho_Chi_Minh_City.html"

options = Options()
options.add_argument("--headless=new")
options.add_argument("--lang=en-US")
options.add_argument("--window-size=1920,1080")
driver = webdriver.Chrome(options=options)
driver.set_page_load_timeout(30)

driver.get(url)
time.sleep(5)
driver.execute_script("window.scrollTo(0, 600);")
time.sleep(2)

soup = BeautifulSoup(driver.page_source, 'html.parser')
driver.quit()

# Kiểm tra JSON-LD
print("=== JSON-LD ===")
for s in soup.find_all('script', type='application/ld+json'):
    try:
        ld = json.loads(s.string or '{}')
        if isinstance(ld, list): ld = ld[0]
        print(json.dumps(ld.get('aggregateRating', 'KHÔNG CÓ'), indent=2))
    except: pass

# Kiểm tra aria-label bubble
print("\n=== aria-label bubble ===")
for tag in soup.find_all(attrs={'aria-label': re.compile(r'bubble', re.I)}):
    print(tag.get('aria-label'))

# Kiểm tra SVG title
print("\n=== SVG title ===")
for t in soup.find_all('title'):
    txt = t.get_text()
    if re.search(r'\d', txt):
        print(txt[:100])

# Kiểm tra text chứa số rating
print("\n=== Text chứa 4. hoặc 3. hoặc 5.0 ===")
for tag in soup.find_all(string=re.compile(r'[345]\.\d')):
    print(repr(tag.strip()[:80]), '|', tag.parent.name, tag.parent.get('class'))