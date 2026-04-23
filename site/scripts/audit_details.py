from playwright.sync_api import sync_playwright
import os

BASE_URL = "https://lobservatoiredespros.com"
OUT_DIR = "/Users/lestoilettesdeminette/stack-2026/lobservatoiredespros/site/screenshots"

def capture_detail():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # 1. Homepage desktop - scroll to CounterLive / section 2
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto(BASE_URL + "/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2500)
        page.evaluate("window.scrollBy(0, 900)")
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(OUT_DIR, "homepage_desktop_scroll1.png"), full_page=False)
        print("OK homepage_desktop_scroll1")

        page.evaluate("window.scrollBy(0, 900)")
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(OUT_DIR, "homepage_desktop_scroll2.png"), full_page=False)
        print("OK homepage_desktop_scroll2")
        page.close()

        # 2. Homepage mobile - scroll to see CounterLive
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(BASE_URL + "/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2500)
        page.evaluate("window.scrollBy(0, 900)")
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(OUT_DIR, "homepage_mobile_scroll1.png"), full_page=False)
        print("OK homepage_mobile_scroll1")
        page.close()

        # 3. Cookie banner close-up - homepage desktop fresh load
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        # Clear storage to get fresh cookie banner
        page.goto(BASE_URL + "/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1500)
        # Crop just the bottom where cookie banner lives
        page.screenshot(path=os.path.join(OUT_DIR, "cookie_banner_desktop.png"), full_page=False, clip={"x": 0, "y": 600, "width": 1280, "height": 200})
        print("OK cookie_banner_desktop")
        page.close()

        # 4. Cookie banner mobile
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(BASE_URL + "/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(OUT_DIR, "cookie_banner_mobile.png"), full_page=False, clip={"x": 0, "y": 644, "width": 390, "height": 200})
        print("OK cookie_banner_mobile")
        page.close()

        # 5. Candidater page - scroll to form
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto(BASE_URL + "/candidater/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        page.evaluate("window.scrollBy(0, 700)")
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(OUT_DIR, "candidater_desktop_form.png"), full_page=False)
        print("OK candidater_desktop_form")
        page.close()

        # 6. Grille devis - scroll to interactive checklist
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto(BASE_URL + "/outils/grille-devis/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        page.evaluate("window.scrollBy(0, 700)")
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(OUT_DIR, "grille_devis_desktop_scroll.png"), full_page=False)
        print("OK grille_devis_desktop_scroll")
        page.close()

        # 7. Glossaire - scroll to entries
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto(BASE_URL + "/glossaire/", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        page.evaluate("window.scrollBy(0, 600)")
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(OUT_DIR, "glossaire_desktop_scroll.png"), full_page=False)
        print("OK glossaire_desktop_scroll")
        page.close()

        browser.close()

if __name__ == "__main__":
    capture_detail()
