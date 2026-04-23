from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://lobservatoiredespros.com?v=3"
METHODE_URL = "https://lobservatoiredespros.com/methode/?v=3"
OUT = "/Users/lestoilettesdeminette/stack-2026/lobservatoiredespros/screenshots"
W, H = 1280, 800

def capture_all():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ---- SHOT 1 : Homepage ATF (no scroll) ----
        page = browser.new_page(viewport={"width": W, "height": H})
        page.goto(BASE_URL, wait_until="networkidle")
        time.sleep(4)
        page.screenshot(path=f"{OUT}/01_home_atf.png", full_page=False)
        print("01_home_atf.png done")

        # ---- SHOT 2 : Homepage scroll 30% ----
        page2 = browser.new_page(viewport={"width": W, "height": H})
        page2.goto(BASE_URL, wait_until="networkidle")
        time.sleep(4)
        full_h = page2.evaluate("document.body.scrollHeight")
        page2.evaluate(f"window.scrollTo(0, {int(full_h * 0.30)})")
        time.sleep(0.5)
        page2.screenshot(path=f"{OUT}/02_home_scroll30.png", full_page=False)
        print(f"02_home_scroll30.png done (scrolled to {int(full_h * 0.30)}px / {full_h}px total)")

        # ---- SHOT 3 : Homepage scroll 60% ----
        page3 = browser.new_page(viewport={"width": W, "height": H})
        page3.goto(BASE_URL, wait_until="networkidle")
        time.sleep(4)
        full_h3 = page3.evaluate("document.body.scrollHeight")
        page3.evaluate(f"window.scrollTo(0, {int(full_h3 * 0.60)})")
        time.sleep(0.5)
        page3.screenshot(path=f"{OUT}/03_home_scroll60.png", full_page=False)
        print(f"03_home_scroll60.png done (scrolled to {int(full_h3 * 0.60)}px / {full_h3}px total)")

        # ---- SHOT 4 : /methode/ ATF ----
        page4 = browser.new_page(viewport={"width": W, "height": H})
        page4.goto(METHODE_URL, wait_until="networkidle")
        time.sleep(4)
        page4.screenshot(path=f"{OUT}/04_methode_atf.png", full_page=False)
        print("04_methode_atf.png done")

        browser.close()

if __name__ == "__main__":
    capture_all()
