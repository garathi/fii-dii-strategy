import yfinance as yf
import json
import os
import sys
import io
import pandas as pd
import math

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Top 150 Liquid Nifty F&O Symbols for Swing Scanning
NIFTY_SYMBOLS = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "SBIN", "BAJFINANCE",
    "ITC", "BHARTIARTL", "KOTAKBANK", "LT", "AXISBANK", "ASIANPAINT", "MARUTI", "SUNPHARMA",
    "TITAN", "ULTRACEMCO", "TATUMOTORS", "BAJAJFINSV", "WIPRO", "NESTLEIND", "HCLTECH", "ONGC",
    "ADANIENT", "NTPC", "JSWSTEEL", "POWERGRID", "M&M", "TATAAIG", "TATASTEEL", "COALINDIA",
    "HINDALCO", "GRASIM", "TECHM", "CIPLA", "APOLLOHOSP", "DIVISLAB", "EICHERMOT", "BAJAJ-AUTO",
    "BRITANNIA", "HEROMOTOCO", "INDUSINDBK", "DRREDDY", "HDFCLIFE", "SBILIFE", "BPCL", "UPL",
    "HAL", "SOLARINDS", "POLYCAB", "MCX", "CDSL", "BSE", "PERSISTENT", "DIXON", "TRENT",
    "BEL", "PIDILITIND", "SIEMENS", "GODREJCP", "CHOLAFIN", "PNB", "BANKBARODA", "ZOMATO",
    "TVSMOTOR", "CUMMINSIND", "INDIGO", "SHREECEM", "HAVELLS", "PFC", "RECLTD", "GAIL",
    "BOSCHLTD", "DLF", "AMBUJACEM", "ABB", "TORNTPHARM", "LODHA", "CGPOWER", "AUBANK",
    "TATACOMM", "SRF", "MARICO", "COLPAL", "PAGEIND", "VOLTAS", "MOTHERSON", "MAXHEALTH",
    "PETRONET", "MUTHOOTFIN", "TRENT", "ESCORTS", "PIIND", "NAUKRI", "MCDOWELL-N", "CONCOR",
    "MRF", "ICICIPRULI", "ASTRAL", "AUROPHARMA", "LUPIN", "NMDC", "IGL", "MGL", "GUJGASLTD",
    "BANDHANBNK", "FEDERALBNK", "IDFCFIRSTB", "CANBK", "UNIONBANK", "INDIANB", "PNB",
    "SAIL", "VEDL", "JINDALSTEL", "TATACHEMICALS", "DEEPAKNTR", "NAVINFLUOR", "AARTIIND",
    "TATAELXSI", "MPHASIS", "COFORGE", "LTIM", "PERSISTENT", "BSOFT", "LTTS"
]

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
    print(f"--- SCANNING {len(NIFTY_SYMBOLS)} STOCKS FOR HEMANT JAIN VALUE SWING TRADES ---")
    results = []
    
    # De-duplicate
    unique_symbols = list(set(NIFTY_SYMBOLS))
    yf_tickers = [sym + ".NS" for sym in unique_symbols]
    
    print("Downloading batch history data from Yahoo Finance...")
    try:
        data = yf.download(yf_tickers, period="1y", group_by="ticker", auto_adjust=True, progress=False)
    except Exception as e:
        print(f"Error downloading data: {e}")
        sys.exit(1)
        
    for sym in unique_symbols:
        ns_sym = sym + ".NS"
        try:
            # Handle yfinance DataFrame structure (if multiple tickers, it's a MultiIndex)
            if len(unique_symbols) > 1:
                df = data[ns_sym].dropna()
            else:
                df = data.dropna()
                
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
                "symbol": ns_sym,
                "cleanSymbol": sym,
                "name": sym, # Using symbol as name since we don't have full names for all 200
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
            # To avoid cluttering the UI with 200 failed stocks, only add qualified or nearly-qualified stocks
            # (e.g. at least uptrend + RSI pullback)
            if is_uptrend and is_rsi_pullback:
                results.append(stock_obj)
            
            if qualified:
                print(f"  ✅ QUALIFIED {sym}: CMP ₹{cmp_val} | RSI {rsi} | VolSpike {vol_spike_ratio}x")

        except Exception as e:
            # Silent continue for missing individual tickers in batch
            continue

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
