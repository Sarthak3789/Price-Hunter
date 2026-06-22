from analyzer import normalize_price, analyze_prices

def mock_scrape_prices():
    # Returning fake data as if we just scraped Amazon IN, Flipkart, and Meesho
    return [
        {
            "site": "amazon_in",
            "url": "https://amazon.in/dp/mock",
            "price_raw": "₹1,999.00"
        },
        {
            "site": "flipkart",
            "url": "https://flipkart.com/mock",
            "price_raw": "₹2,499"
        },
        {
            "site": "meesho",
            "url": "https://meesho.com/mock",
            "price_raw": "₹1,750"
        }
    ]

def run_mock():
    print("=== Starting Price Arbitrage Tracker ===\n")
    product_name = "Generic Smartwatch"
    threshold = 10.0 # 10% threshold
    
    print(f"Checking prices for {product_name}...")
    scraped_data = mock_scrape_prices()
    
    for item in scraped_data:
        item["price_float"] = normalize_price(item["price_raw"])
        print(f" -> Scraped from {item['site'].title()}: {item['price_raw']} (Normalized to float: {item['price_float']})")
            
    is_arbitrage, cheapest, highest, percent_diff = analyze_prices(scraped_data, threshold)
    
    print("\n=== ANALYSIS RESULTS ===")
    if is_arbitrage:
        print(f"✅ Arbitrage found! {percent_diff:.2f}% difference (Threshold is {threshold}%).")
        print(f"\n🚨 [TELEGRAM MESSAGE SENT TO YOUR PHONE] 🚨")
        print(f"📦 Product: {product_name}")
        print(f"💸 Cheapest: {cheapest['site'].title()} - ₹{cheapest['price_float']}")
        print(f"📈 Highest: {highest['site'].title()} - ₹{highest['price_float']}")
        print(f"📊 Difference: {percent_diff:.2f}%")
        print(f"🔗 Buy here: {cheapest['url']}")
    else:
        print(f"❌ No significant arbitrage found. Max diff: {percent_diff:.2f}%")

if __name__ == "__main__":
    run_mock()
