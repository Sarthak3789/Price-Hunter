import re

def normalize_price(price_str):
    """
    Strips currency symbols and commas, returns float.
    Handles common formats: $1,299.99, £900, 199.50, etc.
    """
    if not price_str:
        return None
        
    # Remove everything except digits, commas, and dots
    cleaned = re.sub(r'[^\d.,]', '', price_str)
    if not cleaned:
        return None
        
    last_comma = cleaned.rfind(',')
    last_dot = cleaned.rfind('.')
    
    # Heuristics for European format (comma as decimal separator)
    # 1. Commas appear after dots: 1.299,99
    # 2. Only one comma, and it has 1 or 2 digits after it: 1299,99 or 199,5
    is_european = False
    if last_comma > last_dot and last_dot != -1:
        is_european = True
    elif last_comma != -1 and last_dot == -1 and cleaned.count(',') == 1 and len(cleaned) - last_comma - 1 <= 2:
        is_european = True
        
    if is_european:
        cleaned = cleaned.replace('.', '')
        cleaned = cleaned.replace(',', '.')
    else:
        cleaned = cleaned.replace(',', '')
        
    try:
        return float(cleaned)
    except ValueError:
        return None

def analyze_prices(price_data_list, threshold_percent):
    """
    price_data_list: list of dicts like [{'site': 'amazon', 'url': '...', 'price_raw': '$100', 'price_float': 100.0}]
    Returns: (is_arbitrage, cheapest_site, highest_site, percent_diff) or (False, None, None, 0)
    """
    valid_prices = [p for p in price_data_list if p.get('price_float') is not None]
    
    if len(valid_prices) < 2:
        return False, None, None, 0
        
    # Sort by price
    sorted_prices = sorted(valid_prices, key=lambda x: x['price_float'])
    cheapest = sorted_prices[0]
    highest = sorted_prices[-1]
    
    if cheapest['price_float'] == 0: # Prevent division by zero
        return False, None, None, 0
        
    # Calculate percentage difference based on the cheapest price
    percent_diff = ((highest['price_float'] - cheapest['price_float']) / cheapest['price_float']) * 100
    
    is_arbitrage = percent_diff >= threshold_percent
    
    return is_arbitrage, cheapest, highest, percent_diff
