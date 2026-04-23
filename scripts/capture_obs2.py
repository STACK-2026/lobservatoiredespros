from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://lobservatoiredespros.com?v=3"
OUT = "/Users/lestoilettesdeminette/stack-2026/lobservatoiredespros/screenshots"
W, H = 1280, 800

def capture_extra():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # Capture a la une section (section "A LA UNE" a ~20%)
        page1 = browser.new_page(viewport={"width": W, "height": H})
        page1.goto(BASE_URL, wait_until="networkidle")
        time.sleep(4)
        full_h = page1.evaluate("document.body.scrollHeight")
        print(f"Page height: {full_h}px")
        page1.evaluate(f"window.scrollTo(0, {int(full_h * 0.18)})")
        time.sleep(0.5)
        page1.screenshot(path=f"{OUT}/05_home_alaune.png", full_page=False)
        print(f"05_home_alaune.png done (scroll {int(full_h * 0.18)}px)")

        # Capture classements section (cherche la section LA SELECTION)
        page2 = browser.new_page(viewport={"width": W, "height": H})
        page2.goto(BASE_URL, wait_until="networkidle")
        time.sleep(4)
        full_h2 = page2.evaluate("document.body.scrollHeight")
        page2.evaluate(f"window.scrollTo(0, {int(full_h2 * 0.45)})")
        time.sleep(0.5)
        page2.screenshot(path=f"{OUT}/06_home_scroll45.png", full_page=False)
        print(f"06_home_scroll45.png done (scroll {int(full_h2 * 0.45)}px)")

        page3 = browser.new_page(viewport={"width": W, "height": H})
        page3.goto(BASE_URL, wait_until="networkidle")
        time.sleep(4)
        full_h3 = page3.evaluate("document.body.scrollHeight")
        page3.evaluate(f"window.scrollTo(0, {int(full_h3 * 0.70)})")
        time.sleep(0.5)
        page3.screenshot(path=f"{OUT}/07_home_scroll70.png", full_page=False)
        print(f"07_home_scroll70.png done (scroll {int(full_h3 * 0.70)}px)")

        # Full page screenshot pour tout voir d'un coup
        page4 = browser.new_page(viewport={"width": W, "height": H})
        page4.goto(BASE_URL, wait_until="networkidle")
        time.sleep(4)
        page4.screenshot(path=f"{OUT}/08_home_fullpage.png", full_page=True)
        print("08_home_fullpage.png done")

        browser.close()

if __name__ == "__main__":
    capture_extra()
