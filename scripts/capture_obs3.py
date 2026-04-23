from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://lobservatoiredespros.com?v=3"
OUT = "/Users/lestoilettesdeminette/stack-2026/lobservatoiredespros/screenshots"
W, H = 1280, 800

def capture_alaune():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # Trouve la section A LA UNE exacte
        page = browser.new_page(viewport={"width": W, "height": H})
        page.goto(BASE_URL, wait_until="networkidle")
        time.sleep(4)

        # Scroll jusqu'a la section "À LA UNE"
        result = page.evaluate("""() => {
            const h2s = [...document.querySelectorAll('h2')];
            for (const h of h2s) {
                if (h.textContent.includes('Observations') || h.textContent.includes('LA UNE') || h.textContent.includes('rédaction')) {
                    return {text: h.textContent, top: h.getBoundingClientRect().top + window.scrollY};
                }
            }
            // Fallback: cherche le meta label
            const spans = [...document.querySelectorAll('*')];
            for (const s of spans) {
                if (s.textContent.trim() === 'À LA UNE CETTE SEMAINE') {
                    return {text: s.textContent, top: s.getBoundingClientRect().top + window.scrollY};
                }
            }
            return null;
        }""")
        print(f"A LA UNE element: {result}")

        # Scroll a 800px (juste avant la section)
        page.evaluate("window.scrollTo(0, 800)")
        time.sleep(0.5)
        page.screenshot(path=f"{OUT}/09_alaune_entry.png", full_page=False)
        print("09_alaune_entry.png done")

        # Cherche le hairline/separateur et l'alignement
        page.evaluate("window.scrollTo(0, 1100)")
        time.sleep(0.5)
        page.screenshot(path=f"{OUT}/10_alaune_header.png", full_page=False)
        print("10_alaune_header.png done")

        browser.close()

if __name__ == "__main__":
    capture_alaune()
