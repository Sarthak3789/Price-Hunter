import json
from scraper import scrape_prices

def test_real_scraping():
    with open("config.json", "r") as f:
        config = json.load(f)
        
    for product in config.get("products", []):
        print(f"Testing real scraping for: {product['name']}")
        urls = product.get("urls", [])
        
        results = scrape_prices(urls)
        
        for res in results:
            print(f"[{res['site']}] Raw price: {res['price_raw']}")

if __name__ == "__main__":
    test_real_scraping()
