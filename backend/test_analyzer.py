import sys
from analyzer import normalize_price, analyze_prices

def test_normalize_price():
    assert normalize_price("$1,299.99") == 1299.99
    assert normalize_price("£900") == 900.0
    assert normalize_price("199.50") == 199.50
    assert normalize_price("1,000,000") == 1000000.0
    assert normalize_price("1.299,99") == 1299.99 # European format
    assert normalize_price("Free") == None
    assert normalize_price(None) == None
    assert normalize_price("") == None

def test_analyze_prices_arbitrage_found():
    price_data = [
        {"site": "A", "price_float": 100.0, "url": "a.com"},
        {"site": "B", "price_float": 115.0, "url": "b.com"}
    ]
    is_arb, cheapest, highest, diff = analyze_prices(price_data, 10.0)
    assert is_arb is True
    assert cheapest["site"] == "A"
    assert highest["site"] == "B"
    assert diff == 15.0

def test_analyze_prices_no_arbitrage():
    price_data = [
        {"site": "A", "price_float": 100.0, "url": "a.com"},
        {"site": "B", "price_float": 105.0, "url": "b.com"}
    ]
    is_arb, cheapest, highest, diff = analyze_prices(price_data, 10.0)
    assert is_arb is False
    assert diff == 5.0

def test_analyze_prices_missing_data():
    price_data = [
        {"site": "A", "price_float": 100.0, "url": "a.com"},
        {"site": "B", "price_float": None, "url": "b.com"}
    ]
    is_arb, cheapest, highest, diff = analyze_prices(price_data, 10.0)
    assert is_arb is False

if __name__ == "__main__":
    test_normalize_price()
    test_analyze_prices_arbitrage_found()
    test_analyze_prices_no_arbitrage()
    test_analyze_prices_missing_data()
    print("All tests passed!")
    sys.exit(0)
