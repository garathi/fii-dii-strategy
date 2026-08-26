import yfinance as yf
import json
import os
import sys
import io
import pandas as pd

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Target instruments across all tabs
SYMBOLS = [
    "^NSEI",           # Nifty 50 Index
    "^NSEBANK",        # Nifty Bank Index
    "HAL.NS",          # Hindustan Aeronautics
    "POLYCAB.NS",      # Polycab India
    "SOLARINDS.NS",    # Solar Industries
    "DIXON.NS",        # Dixon Technologies
    "TRENT.NS",        # Trent Ltd
    "BSE.NS",          # BSE Ltd
    "MCX.NS",          # MCX India
    "CDSL.NS",         # CDSL
    "BHARTIARTL.NS",   # Bharti Airtel
    "PERSISTENT.NS",   # Persistent Systems
    "KAYNES.NS",       # Kaynes Technology
    "INR=X",           # USD / INR
    "EURINR=X",        # EUR / INR
    "GBPINR=X",        # GBP / INR
    "JPYINR=X"         # JPY / INR
]

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def fetch_all_live_prices():
    print("--- FETCHING 100% REAL LIVE MARKET QUOTES VIA YFINANCE ---")
    live_data = {}

    for sym in SYMBOLS:
        try:
            ticker = yf.Ticker(sym)
            df = ticker.history(period="1y")
            if df.empty or len(df) < 5:
                print(f"⚠️ Warning: Could not fetch data for {sym}")
                continue

            latest = df.iloc[-1]
            prev = df.iloc[-2]

            close_price = round(float(latest['Close']), 2)
            prev_close = round(float(prev['Close']), 2)
            daily_change_pct = round(((close_price - prev_close) / prev_close) * 100, 2)
            high_52 = round(float(df['High'].max()), 2)
            dist_from_ath = round(((high_52 - close_price) / high_52) * 100, 2)

            df['DMA20'] = df['Close'].rolling(window=20).mean()
            df['DMA100'] = df['Close'].rolling(window=100).mean()
            df['RSI'] = calculate_rsi(df['Close'], 14)

            dma20 = round(float(df['DMA20'].iloc[-1]), 2) if len(df) >= 20 else close_price
            dma100 = round(float(df['DMA100'].iloc[-1]), 2) if len(df) >= 100 else close_price
            rsi = round(float(df['RSI'].iloc[-1]), 2) if len(df) >= 14 else 50.0

            clean_symbol = sym.replace(".NS", "").replace("=X", "").replace("^", "")

            live_data[clean_symbol] = {
                "symbol": sym,
                "cleanSymbol": clean_symbol,
                "cmp": close_price,
                "prevClose": prev_close,
                "todayChangePct": daily_change_pct,
                "high52": high_52,
                "distFromHighPct": dist_from_ath,
                "dma20": dma20,
                "dma100": dma100,
                "rsi": rsi,
                "timestamp": pd.Timestamp.now().isoformat()
            }
            print(f"  ✓ {clean_symbol}: CMP ₹{close_price} (Today: {daily_change_pct}%) | 52W High: ₹{high_52} | 20DMA: ₹{dma20} | RSI: {rsi}")

        except Exception as e:
            print(f"Error fetching {sym}: {e}")

    if not live_data:
        print("⚠️ CRITICAL: Yahoo Finance returned empty data for all symbols (Likely Rate Limited). Aborting save to preserve cache.")
        sys.exit(1)

    output_path = os.path.join(os.path.dirname(__file__), 'real_live_market_quotes.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(live_data, f, indent=2)

    print(f"\n✓ Saved 100% Real Quotes to real_live_market_quotes.json")

if __name__ == "__main__":
    fetch_all_live_prices()
