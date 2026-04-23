from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = "/Users/lestoilettesdeminette/stack-2026/lobservatoiredespros/screenshots"


def capture_scroll(url, output_path, width, height, scroll_y, wait_ms=5000):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(url, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(wait_ms)
        # Dismiss cookie banner if present
        try:
            page.click("text=Refuser", timeout=2000)
            page.wait_for_timeout(500)
        except Exception:
            pass
        page.evaluate(f"window.scrollTo(0, {scroll_y})")
        page.wait_for_timeout(800)
        page.screenshot(path=output_path, full_page=False)
        browser.close()
        print(f"Saved: {output_path}")


if __name__ == "__main__":
    # Fiche pro - mid section (P0.3 "Ce que nous ne savons pas encore")
    capture_scroll(
        "https://lobservatoiredespros.com/pro/robert-tetard-auxerre/?v=p0",
        f"{SCREENSHOTS_DIR}/p0_fiche_pro_desktop_mid.png",
        1280, 800, 900
    )
    capture_scroll(
        "https://lobservatoiredespros.com/pro/robert-tetard-auxerre/?v=p0",
        f"{SCREENSHOTS_DIR}/p0_fiche_pro_desktop_low.png",
        1280, 800, 1800
    )
    # Fiche pro mobile mid
    capture_scroll(
        "https://lobservatoiredespros.com/pro/robert-tetard-auxerre/?v=p0",
        f"{SCREENSHOTS_DIR}/p0_fiche_pro_mobile_mid.png",
        390, 844, 900
    )
    # Home desktop - scroll past cookie banner to see H1 fully
    capture_scroll(
        "https://lobservatoiredespros.com/?v=p0",
        f"{SCREENSHOTS_DIR}/p0_home_desktop_nocookie.png",
        1280, 800, 0
    )
    print("Done.")
