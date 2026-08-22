import requests
import json
import datetime
import os

def fetch_real_nifty_history():
    print("Fetching 100% REAL daily NIFTY 50 historical data from Yahoo Finance (^NSEI)...")
    url = "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=1y&interval=1d"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    resp = requests.get(url, headers=headers, timeout=10)
    data = resp.json()

    result = data["chart"]["result"][0]
    timestamps = result["timestamp"]
    quote = result["indicators"]["quote"][0]
    
    opens = quote["open"]
    highs = quote["high"]
    lows = quote["low"]
    closes = quote["close"]

    real_data = []

    for i in range(len(timestamps)):
        if closes[i] is None or opens[i] is None:
            continue
            
        dt = datetime.datetime.fromtimestamp(timestamps[i])
        date_str = dt.strftime("%Y-%m-%d")
        
        real_data.append({
            "date": date_str,
            "formattedDate": dt.strftime("%b %d"),
            "open": round(opens[i], 2),
            "high": round(highs[i], 2),
            "low": round(lows[i], 2),
            "close": round(closes[i], 2),
            "niftyClose": round(closes[i], 2)
        })

    out_file = os.path.join(os.path.dirname(__file__), "real_nifty_history.json")
    with open(out_file, "w") as f:
        json.dump(real_data, f, indent=2)

    print(f"Successfully saved {len(real_data)} REAL daily NIFTY 50 price records to real_nifty_history.json!")
    print(f"Latest Nifty Close ({real_data[-1]['date']}): {real_data[-1]['close']}")

if __name__ == "__main__":
    fetch_real_nifty_history()
