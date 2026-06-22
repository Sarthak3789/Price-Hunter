import requests
import logging

def send_telegram_alert(bot_token, chat_id, product_name, cheapest_site, highest_site, percent_diff):
    """
    Sends an alert message to a Telegram chat.
    """
    if not bot_token or not chat_id or bot_token == "<YOUR_TELEGRAM_BOT_TOKEN>":
        logging.warning("Telegram credentials not configured properly. Skipping alert.")
        print(f"[DRY RUN ALERT] Arbitrage found for {product_name}!")
        print(f"Cheapest: {cheapest_site['site']} - ${cheapest_site['price_float']} ({cheapest_site['url']})")
        print(f"Highest: {highest_site['site']} - ${highest_site['price_float']}")
        print(f"Difference: {percent_diff:.2f}%")
        return False
        
    message = (
        f"🚨 <b>Arbitrage Opportunity Detected!</b> 🚨\n\n"
        f"📦 <b>Product:</b> {product_name}\n\n"
        f"💸 <b>Cheapest:</b> {cheapest_site['site'].title()} - ${cheapest_site['price_float']}\n"
        f"📈 <b>Highest:</b> {highest_site['site'].title()} - ${highest_site['price_float']}\n"
        f"📊 <b>Difference:</b> {percent_diff:.2f}%\n\n"
        f"🔗 <b>Buy here:</b> <a href='{cheapest_site['url']}'>Link to {cheapest_site['site']}</a>"
    )
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        logging.info("Telegram alert sent successfully.")
        return True
    except Exception as e:
        logging.error(f"Failed to send Telegram alert: {e}")
        return False
