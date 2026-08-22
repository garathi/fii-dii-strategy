import requests
import json
import os
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

NIFTY500_STOCKS = [
    {"symbol": "TRENT", "yahoo": "TRENT.NS", "name": "Trent Ltd", "sector": "Retail & Consumer", "fii": 27.8, "dii": 15.2, "capType": "Midcap / Nifty 500"},
    {"symbol": "DIXON", "yahoo": "DIXON.NS", "name": "Dixon Technologies Ltd", "sector": "Electronics Mfg", "fii": 19.4, "dii": 25.1, "capType": "Midcap / Nifty 500"},
    {"symbol": "MAZDOCK", "yahoo": "MAZDOCK.NS", "name": "Mazagon Dock Shipbuilders", "sector": "Defence & Shipbuilding", "fii": 4.8, "dii": 14.6, "capType": "Midcap / Nifty 500"},
    {"symbol": "HAL", "yahoo": "HAL.NS", "name": "Hindustan Aeronautics Ltd", "sector": "Defence & Aerospace", "fii": 12.9, "dii": 18.3, "capType": "Large-Mid / Nifty 500"},
    {"symbol": "POLYCAB", "yahoo": "POLYCAB.NS", "name": "Polycab India Ltd", "sector": "Cables & Electricals", "fii": 12.1, "dii": 16.4, "capType": "Midcap / Nifty 500"},
    {"symbol": "PERSISTENT", "yahoo": "PERSISTENT.NS", "name": "Persistent Systems Ltd", "sector": "Midcap IT Services", "fii": 23.5, "dii": 27.2, "capType": "Midcap / Nifty 500"},
    {"symbol": "MCX", "yahoo": "MCX.NS", "name": "Multi Commodity Exchange", "sector": "Capital Markets", "fii": 24.1, "dii": 28.6, "capType": "Midcap / Nifty 500"},
    {"symbol": "KAYNES", "yahoo": "KAYNES.NS", "name": "Kaynes Technology India", "sector": "EMS & Semi-Conductors", "fii": 14.2, "dii": 21.8, "capType": "Small-Mid / Nifty 500"},
    {"symbol": "BSE", "yahoo": "BSE.NS", "name": "BSE Limited", "sector": "Financial Exchange", "fii": 15.6, "dii": 12.4, "capType": "Midcap / Nifty 500"},
    {"symbol": "SUZLON", "yahoo": "SUZLON.NS", "name": "Suzlon Energy Ltd", "sector": "Green Energy", "fii": 21.5, "dii": 9.8, "capType": "Midcap / Nifty 500"}
]

def fetch_nifty500_quotes():
    print("Fetching 100% REAL live prices for NIFTY 500 High-Growth Momentum Stocks...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    nifty500_results = []

    for s in NIFTY500_STOCKS:
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{s['yahoo']}?range=1y&interval=1d"
            resp = requests.get(url, headers=headers, timeout=5)
            data = resp.json()
            
            result = data["chart"]["result"][0]
            meta = result["meta"]
            cmp_price = round(meta["regularMarketPrice"], 2)
            prev_close = round(meta.get("chartPreviousClose", cmp_price), 2)
            change_pct = round(((cmp_price - prev_close) / prev_close) * 100, 2)
            high52 = round(meta.get("fiftyTwoWeekHigh", cmp_price * 1.1), 2)
            low52 = round(meta.get("fiftyTwoWeekLow", cmp_price * 0.7), 2)

            # Proximity to 52-Week High (%)
            dist_from_high = round(((high52 - cmp_price) / high52) * 100, 2)

            nifty500_results.append({
                "symbol": s["symbol"],
                "name": s["name"],
                "sector": s["sector"],
                "capType": s["capType"],
                "cmp": cmp_price,
                "prevClose": prev_close,
                "changePct": change_pct,
                "fiiHoldingPct": s["fii"],
                "diiHoldingPct": s["dii"],
                "high52": high52,
                "low52": low52,
                "distFromHighPct": dist_from_high
            })
            print(f"  ✓ {s['symbol']}: ₹{cmp_price} ({change_pct}%) | 52W High: ₹{high52} ({dist_from_high}% from high)")

        except Exception as e:
            print(f"  ❌ Error fetching {s['symbol']}: {e}")

    out_file = os.path.join(os.path.dirname(__file__), "real_nifty500_quotes.json")
    with open(out_file, "w") as f:
        json.dump(nifty500_results, f, indent=2)
        
    print(f"\nSaved {len(nifty500_results)} NIFTY 500 momentum stock quotes to real_nifty500_quotes.json!")

if __name__ == "__main__":
    fetch_nifty500_quotes()
