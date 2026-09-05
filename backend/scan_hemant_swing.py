import yfinance as yf
import json
import os
import sys
import io
import pandas as pd
import math

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Target symbols for Nifty 500 subset (for demonstration we use our configured pool, 
# in production this can be expanded to all 500 symbols via a CSV).
STOCKS_CONFIG = [
    {"symbol": "HAL.NS", "cleanSymbol": "HAL", "name": "Hindustan Aeronautics"},
    {"symbol": "SOLARINDS.NS", "cleanSymbol": "SOLARINDS", "name": "Solar Industries"},
    {"symbol": "POLYCAB.NS", "cleanSymbol": "POLYCAB", "name": "Polycab India"},
    {"symbol": "MCX.NS", "cleanSymbol": "MCX", "name": "Multi Commodity Exchange"},
    {"symbol": "CDSL.NS", "cleanSymbol": "CDSL", "name": "CDSL India"},
    {"symbol": "BHARTIARTL.NS", "cleanSymbol": "BHARTIARTL", "name": "Bharti Airtel"},
    {"symbol": "BSE.NS", "cleanSymbol": "BSE", "name": "BSE Limited"},
    {"symbol": "PERSISTENT.NS", "cleanSymbol": "PERSISTENT", "name": "Persistent Systems"},
    {" অঙ্গ": "DIXON.NS", "cleanSymbol": "DIXON", "name": "Dixon Technologies"},
    {"symbol": "TRENT.NS", "cleanSymbol": "TRENT", "name": "Trent Ltd"}
]

# Quick fix for dictionary key typo
STOCKS_CONFIG[8]["symbol"] = "DIXON.NS"

def safe_float(val, fallback=0.0):
    try:
        f = float(val)
        return fallback if math.isnan(f) else f
    except:
        return fallback

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_macd(series, fast=12, slow=26, signal=9):
    fast_ema = series.ewm(span=fast, adjust=False).mean()
    slow_ema = series.ewm(span=slow, adjust=False).mean()
    macd = fast_ema - slow_ema
    macd_signal = macd.ewm(span=signal, adjust=False).mean()
    return macd, macd_signal

def generate_hemant_swing_signals():
    print("--- SCANNING FOR HEMANT JAIN VALUE SWING TRADES ---")
    results = []

    for item in STOCKS_CONFIG:
        sym = item["symbol"]
        try:
            ticker = yf.Ticker(sym)
            df = ticker.history(period="1y")
            if df.empty or len(df) < 200:
                continue

            latest = df.iloc[-1]
            prev = df.iloc[-2]

            cmp_val = round(safe_float(latest['Close']), 2)
            
            # 1. EMAs
            df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
            df['EMA200'] = df['Close'].ewm(span=200, adjust=False).mean()
            ema50 = safe_float(df['EMA50'].iloc[-1])
            ema200 = safe_float(df['EMA200'].iloc[-1])
            
            # Uptrend filter
            is_uptrend = (cmp_val > ema50) and (ema50 > ema200)

            # 2. RSI (Momentum Pullback)
            df['RSI'] = calculate_rsi(df['Close'], 14)
            rsi = round(safe_float(df['RSI'].iloc[-1]), 2)
            is_rsi_pullback = 40 <= rsi <= 60

            # 3. Volume Spike
            df['Vol20'] = df['Volume'].rolling(window=20).mean()
            vol_today = safe_float(latest['Volume'])
            vol_avg20 = safe_float(df['Vol20'].iloc[-1])
            vol_spike_ratio = round(vol_today / vol_avg20, 2) if vol_avg20 > 0 else 0
            is_vol_spike = vol_spike_ratio >= 1.5

            # 4. MACD
            macd, macd_sig = calculate_macd(df['Close'])
            macd_val = safe_float(macd.iloc[-1])
            macd_sig_val = safe_float(macd_sig.iloc[-1])
            is_macd_bullish = macd_val > macd_sig_val

            # 5. Envelope Strategy (20 SMA +/- 5%)
            df['SMA20'] = df['Close'].rolling(window=20).mean()
            sma20 = safe_float(df['SMA20'].iloc[-1])
            env_lower = sma20 * 0.95
            env_upper = sma20 * 1.05
            is_envelope_pullback = cmp_val <= env_lower

            # Qualification check
            qualified = is_uptrend and is_rsi_pullback and is_vol_spike and is_macd_bullish and is_envelope_pullback

            # Always add to results so UI can show the scanned list and why it failed/passed
            stock_obj = {
                "symbol": sym,
                "cleanSymbol": item["cleanSymbol"],
                "name": item["name"],
                "cmp": cmp_val,
                "ema50": round(ema50, 2),
                "ema200": round(ema200, 2),
                "rsi": rsi,
                "volumeSpike": vol_spike_ratio,
                "macdBullish": is_macd_bullish,
                "envLower": round(env_lower, 2),
                "isEnvPullback": is_envelope_pullback,
                "isQualified": qualified,
                "scannedAt": pd.Timestamp.now().strftime('%d %b %Y %H:%M')
            }
            results.append(stock_obj)
            
            status = "✅ QUALIFIED" if qualified else "❌ FAILED"
            print(f"  {status} {item['cleanSymbol']}: CMP ₹{cmp_val} | RSI {rsi} | VolSpike {vol_spike_ratio}x")

        except Exception as e:
            print(f"Error {sym}: {e}")

    if not results:
        print("⚠️ CRITICAL: Yahoo Finance returned empty data (Rate Limited). Aborting save.")
        sys.exit(1)

    # Sort qualified first
    results.sort(key=lambda x: (not x['isQualified'], -x['volumeSpike']))

    output_path = os.path.join(os.path.dirname(__file__), 'hemant_swing_signals.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({"stocks": results, "timestamp": pd.Timestamp.now().isoformat()}, f, indent=2)

    print(f"\n✓ Saved {len(results)} Stocks to hemant_swing_signals.json")

if __name__ == "__main__":
    generate_hemant_swing_signals()
