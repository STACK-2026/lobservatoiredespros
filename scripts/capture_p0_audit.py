from playwright.sync_api import sync_playwright
import time

SCREENSHOTS_DIR = "/Users/lestoilettesdeminette/stack-2026/lobservatoiredespros/screenshots"

PAGES = [
    {
        "url": "https://lobservatoiredespros.com/?v=p0",
        "name": "home",
        "wait": 5000,
    },
    {
        "url": "https://lobservatoiredespros.com/plombier/yonne-89/?v=p0",
        "name": "classement",
        "wait": 5000,
    },
    {
        "url": "https://lobservatoiredespros.com/pro/robert-tetard-auxerre/?v=p0",
        "name": "fiche_pro",
        "wait": 5000,
    },
]

VIEWPORTS = [
    {"width": 1280, "height": 800, "label": "desktop"},
    {"width": 390, "height": 844, "label": "mobile"},
]


def capture(url, output_path, width, height, wait_ms=5000):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(url, wait_until="networkidle", timeout=30000)
        # Extra wait for animations + ticker + cookie banner
        page.wait_for_timeout(wait_ms)
        page.screenshot(path=output_path, full_page=False)
        browser.close()
        print(f"Saved: {output_path}")


if __name__ == "__main__":
    for pg in PAGES:
        for vp in VIEWPORTS:
            out = f"{SCREENSHOTS_DIR}/p0_{pg['name']}_{vp['label']}.png"
            print(f"Capturing {pg['url']} @ {vp['width']}x{vp['height']} ...")
            capture(pg["url"], out, vp["width"], vp["height"], pg["wait"])
    print("Done.")
