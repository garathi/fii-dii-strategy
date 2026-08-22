import requests
import json
import datetime
import os

def fetch_intraday_930_nifty():
    print("Fetching 15-MINUTE INTRADAY NIFTY 50 candles for 9:30 AM Execution Analysis...")
    url = "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=60d&interval=15m"
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

    # Group 15-min candles by trading day
    days_dict = {}

    for i in range(len(timestamps)):
        if closes[i] is None or opens[i] is None:
            continue
            
        dt = datetime.datetime.fromtimestamp(timestamps[i])
        date_str = dt.strftime("%Y-%m-%d")
        time_str = dt.strftime("%H:%M")
        
        if date_str not in days_dict:
            days_dict[date_str] = []
            
        days_dict[date_str].append({
            "time": time_str,
            "open": round(opens[i], 2),
            "high": round(highs[i], 2),
            "low": round(lows[i], 2),
            "close": round(closes[i], 2)
        })

    intraday_days = []

    sorted_dates = sorted(days_dict.keys())
    for d_idx, date_str in enumerate(sorted_dates):
        candles = days_dict[date_str]
        if len(candles) < 5:
            continue
            
        day_open = candles[0]["open"]
        # Find 9:30 AM candle (usually 2nd 15-min candle around 09:30)
        candle_930 = next((c for c in candles if c["time"] in ["09:30", "09:31", "09:45"]), candles[1] if len(candles)>1 else candles[0])
        price_930 = candle_930["open"]
        
        day_high = max(c["high"] for c in candles)
        day_low = min(c["low"] for c in candles)
        day_close = candles[-1]["close"]
        
        # Overnight Gap (compared to previous day close)
        prev_close = sorted_dates[d_idx-1] if d_idx > 0 else None
        prev_close_price = days_dict[prev_close][-1]["close"] if prev_close and prev_close in days_dict else day_open
        gap_points = round(day_open - prev_close_price, 2)
        
        # Intraday movement from 9:30 AM Entry to 3:30 PM Close
        intraday_move_from_930 = round(day_close - price_930, 2)
        # Max Intraday Adverse Excursion (Spike from 9:30 AM)
        max_up_spike = round(day_high - price_930, 2)
        max_down_spike = round(price_930 - day_low, 2)

        intraday_days.append({
            "date": date_str,
            "prevClose": prev_close_price,
            "open915": day_open,
            "price930": price_930,
            "high": day_high,
            "low": day_low,
            "close330": day_close,
            "gapPoints": gap_points,
            "intradayMoveFrom930": intraday_move_from_930,
            "maxUpSpike": max_up_spike,
            "maxDownSpike": max_down_spike
        })

    out_file = os.path.join(os.path.dirname(__file__), "real_nifty_intraday_930.json")
    with open(out_file, "w") as f:
        json.dump(intraday_days, f, indent=2)

    print(f"Successfully processed {len(intraday_days)} trading days with 9:30 AM entry prices, overnight gaps & intraday spikes!")
    print(f"Sample recent day ({intraday_days[-1]['date']}): 9:30 AM Price = {intraday_days[-1]['price930']}, Gap = {intraday_days[-1]['gapPoints']} pts, Intraday Move from 9:30 = {intraday_days[-1]['intradayMoveFrom930']} pts")

if __name__ == "__main__":
    fetch_intraday_930_nifty()
