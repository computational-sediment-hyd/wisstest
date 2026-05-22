import requests
from bs4 import BeautifulSoup
import csv
import io

url = TARGET_URL

headers = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0 Safari/537.36"
    )
}

# Pyodideでは requests は pyodide-http により fetch 経由で動作
r = requests.get(url, headers=headers, timeout=20)
r.raise_for_status()

html = r.text

soup = BeautifulSoup(html, "html5lib")
tables = soup.find_all("table")

if len(tables) < 2:
    raise RuntimeError(f"表が2個未満でした。検出数={len(tables)}")

target_table = tables[1]  # 元コード tables[1] に合わせる

rows = []
for tr in target_table.find_all("tr"):
    cells = tr.find_all(["th", "td"])
    row = [c.get_text(strip=True) for c in cells]
    if row:
        rows.append(row)

if not rows:
    raise RuntimeError("表の行を取得できませんでした。")

buf = io.StringIO()
w = csv.writer(buf, lineterminator="
")
for row in rows:
    w.writerow(row)

buf.getvalue()
