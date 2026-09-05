import yfinance as yf
import json
import os
import sys
import io
import pandas as pd
import math

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import requests
import io

# Fetch Nifty 500 dynamically from NSE
def get_nifty_500_symbols():
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        res = requests.get('https://nsearchives.nseindia.com/content/indices/ind_nifty500list.csv', headers=headers, timeout=10)
        df = pd.read_csv(io.StringIO(res.text))
        return df['Symbol'].tolist()
    except Exception as e:
        print(f"Failed to fetch Nifty 500 from NSE: {e}. Falling back to top 50.")
        return ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "SBIN", "BAJFINANCE", "ITC", "BHARTIARTL"]

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

def check_knoxville_divergence(df, lookback=150):
    if len(df) < lookback:
        return False
        
    df['MOM20'] = df['Close'] - df['Close'].shift(20)
    df['RSI21'] = calculate_rsi(df['Close'], 21)
    
    current_rsi = safe_float(df['RSI21'].iloc[-1])
    current_price = safe_float(df['Close'].iloc[-1])
    current_mom = safe_float(df['MOM20'].iloc[-1])
    
    # Bullish Divergence requires RSI to be heavily oversold (<= 35 in Indian markets)
    if current_rsi > 35 or math.isnan(current_rsi):
        return False
        
    window = df.iloc[-lookback:-1] # Past 150 days excluding today
    if window.empty:
        return False
        
    # Find the historical minimum price in the lookback window
    min_idx = window['Close'].idxmin()
    if pd.isna(min_idx):
        return False
        
    min_price_in_window = safe_float(window.loc[min_idx, 'Close'])
    mom_at_min_price = safe_float(window.loc[min_idx, 'MOM20'])
    
    # Divergence: Price is a Lower Low, but Momentum is a Higher Low
    if current_price < min_price_in_window and current_mom > mom_at_min_price:
        return True
        
    return False

def calculate_macd(series, fast=12, slow=26, signal=9):
    fast_ema = series.ewm(span=fast, adjust=False).mean()
    slow_ema = series.ewm(span=slow, adjust=False).mean()
    macd = fast_ema - slow_ema
    macd_signal = macd.ewm(span=signal, adjust=False).mean()
    return macd, macd_signal

def generate_hemant_swing_signals():
    symbols = get_nifty_500_symbols()
    print(f"--- SCANNING {len(symbols)} STOCKS FOR HEMANT JAIN VALUE SWING TRADES ---")
    results = []
    
    # De-duplicate
    unique_symbols = list(set(symbols))
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

            # 6. Rob Booker Knoxville Divergence
            is_knox_div = check_knoxville_divergence(df, lookback=150)

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
                "isKnoxDiv": is_knox_div,
                "isTechnicalQualified": qualified,
                "isQualified": False, # Will be determined after fundamental scan
                "ttmProfitCr": 0,
                "scannedAt": pd.Timestamp.now().strftime('%d %b %Y %H:%M')
            }
            # To avoid cluttering the UI, only keep stocks that pass ALL technical checks OR have a Knox Div
            if qualified or is_knox_div:
                results.append(stock_obj)
            
        except Exception as e:
            # Silent continue for missing individual tickers in batch
            continue

    if not results:
        print("⚠️ CRITICAL: Yahoo Finance returned empty data or 0 stocks passed. Aborting save to preserve UI.")
        sys.exit(1)
        
    print(f"\nFetching Fundamental Data (TTM Net Profit > 200 Cr) for {len(results)} technically filtered stocks...")
    final_output = []
    for stock in results:
        try:
            ticker = yf.Ticker(stock["symbol"])
            info = ticker.info
            # 'netIncomeToCommon' is usually returned in INR (since it's an Indian stock)
            net_income = info.get('netIncomeToCommon') or info.get('netIncome') or 0
            
            # Convert to Crores (1 Crore = 10,000,000)
            profit_cr = round(net_income / 10000000, 2)
            stock["ttmProfitCr"] = profit_cr
            
            # Final Qualification: Technicals + Fundamentals (Profit > 200 Cr)
            if stock["isTechnicalQualified"] and profit_cr > 200:
                stock["isQualified"] = True
            
            # Since the user requested strictly ONLY stocks that satisfy the criteria:
            if stock["isQualified"] or stock["isKnoxDiv"]:
                final_output.append(stock)
                print(f"  ✅ ADDING TO UI {stock['cleanSymbol']}: CMP ₹{stock['cmp']} | Profit: {profit_cr} Cr | RSI {stock['rsi']}")
        except:
            stock["ttmProfitCr"] = 0

    # Sort qualified first
    final_output.sort(key=lambda x: (not x['isQualified'], -x['volumeSpike']))

    output_path = os.path.join(os.path.dirname(__file__), 'hemant_swing_signals.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({"stocks": final_output, "timestamp": pd.Timestamp.now().isoformat()}, f, indent=2)

    print(f"\n✓ Saved {len(final_output)} Stocks to hemant_swing_signals.json")

if __name__ == "__main__":
    generate_hemant_swing_signals()
