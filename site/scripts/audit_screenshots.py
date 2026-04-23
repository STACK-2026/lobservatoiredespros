from playwright.sync_api import sync_playwright
import os

BASE_URL = "https://lobservatoiredespros.com"
OUT_DIR = "/Users/lestoilettesdeminette/stack-2026/lobservatoiredespros/site/screenshots"

PAGES = [
    ("homepage", "/"),
    ("methode", "/methode/"),
    ("candidater", "/candidater/"),
    ("grille_devis", "/outils/grille-devis/"),
    ("glossaire", "/glossaire/"),
]

VIEWPORTS = [
    ("desktop", 1280, 800),
    ("mobile", 390, 844),  # iPhone 13
]

def capture_all():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for slug, path in PAGES:
            url = BASE_URL + path
            for device, w, h in VIEWPORTS:
                page = browser.new_page(viewport={"width": w, "height": h})
                try:
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    # Wait a bit for animations to settle
                    page.wait_for_timeout(2000)
                    out = os.path.join(OUT_DIR, f"{slug}_{device}.png")
                    page.screenshot(path=out, full_page=False)
                    print(f"OK: {out}")
                except Exception as e:
                    print(f"ERROR {url} {device}: {e}")
                finally:
                    page.close()
        browser.close()

if __name__ == "__main__":
    capture_all()
