from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
import urllib.parse

def debug_shopping(query):
    encoded_query = urllib.parse.quote_plus(query)
    search_url = f"https://www.google.com/search?q={encoded_query}&udm=28"
    
    print(f"Navigating to {search_url}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-blink-features=AutomationControlled"])
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        stealth_sync(page)
        
        page.goto(search_url, wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        
        title = page.title()
        print(f"Page Title: {title}")
        
        with open("debug.html", "w") as f:
            f.write(page.content())
        print("Saved to debug.html")
        browser.close()

if __name__ == "__main__":
    debug_shopping("iphone 15")
