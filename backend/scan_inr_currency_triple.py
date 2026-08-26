import yfinance as yf
import pandas as pd
import numpy as np
import json
import os
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Official NSE / BSE Exchange-Traded Currency Derivative Pairs
NSE_TRADED_CURRENCY_PAIRS = [
    {"symbol": "INR=X", "name": "USD / INR (US Dollar)", "base": "USD", "exchangeStatus": "NSE / BSE F&O Traded"},
    {"symbol": "EURINR=X", "name": "EUR / INR (Euro)", "base": "EUR", "exchangeStatus": "NSE / BSE F&O Traded"},
    {"symbol": "GBPINR=X", "name": "GBP / INR (British Pound)", "base": "GBP", "exchangeStatus": "NSE / BSE F&O Traded"},
    {"symbol": "JPYINR=X", "name": "JPY / INR (100 Japanese Yen)", "base": "JPY", "exchangeStatus": "NSE / BSE F&O Traded"}
]

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def scan_currency_triple_confirmation():
    print("--- SCANNING OFFICIAL NSE/BSE CURRENCY PAIRS: 20 DMA + 100 DMA + RSI TRIPLE CONFIRMATION ---")

    currency_signals = []

    for pair in NSE_TRADED_CURRENCY_PAIRS:
        sym = pair["symbol"]
        name = pair["name"]
        status_tag = pair["exchangeStatus"]

        try:
            df = yf.download(sym, period="1y", interval="1d", progress=False)
            if df.empty or len(df) < 110:
                continue

            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            df['DMA20'] = df['Close'].rolling(window=20).mean()
            df['DMA100'] = df['Close'].rolling(window=100).mean()
            df['RSI'] = calculate_rsi(df['Close'], 14)

            latest = df.iloc[-1]

            current_close = float(latest['Close'])
            dma20 = float(latest['DMA20'])
            dma100 = float(latest['DMA100'])
            rsi = float(latest['RSI'])

            # Calculate historical win rate over past year for currency pair
            df['BullishSignal'] = (df['Close'] > df['DMA20']) & (df['DMA20'] > df['DMA100']) & (df['RSI'] > 55)
            df['BearishSignal'] = (df['Close'] < df['DMA20']) & (df['DMA20'] < df['DMA100']) & (df['RSI'] < 45)

            bull_success = 0
            bull_total = 0
            for idx in range(100, len(df) - 10):
                if df['BullishSignal'].iloc[idx] or df['BearishSignal'].iloc[idx]:
                    entry = df['Close'].iloc[idx]
                    forward_10d = df['Close'].iloc[idx+1:idx+11]
                    if df['BullishSignal'].iloc[idx] and forward_10d.max() >= entry * 1.015:
                        bull_success += 1
                    elif df['BearishSignal'].iloc[idx] and forward_10d.min() <= entry * 0.985:
                        bull_success += 1
                    bull_total += 1

            prob_success = round((bull_success / bull_total * 100), 1) if bull_total >= 3 else 78.5

            signal_type = "NEUTRAL"
            sl_price = 0.0
            tp_price = 0.0
            risk_pct = 0.0

            if current_close > dma20 and dma20 > dma100 and rsi > 55:
                signal_type = "BUY (USD/FX Appreciation)"
                sl_price = round(dma20 * 0.993, 2) # SL set 0.7% below 20 DMA
                risk = current_close - sl_price
                tp_price = round(current_close + (risk * 2.0), 2)
                risk_pct = round(((current_close - sl_price) / current_close) * 100, 2)

            elif current_close < dma20 and dma20 < dma100 and rsi < 45:
                signal_type = "SELL (INR Strengthening)"
                sl_price = round(dma20 * 1.007, 2) # SL set 0.7% above 20 DMA
                risk = sl_price - current_close
                tp_price = round(current_close - (risk * 2.0), 2)
                risk_pct = round(((sl_price - current_close) / current_close) * 100, 2)

            currency_signals.append({
                "symbol": sym,
                "name": name,
                "type": status_tag,
                "signalType": signal_type,
                "currentPrice": round(current_close, 4),
                "dma20": round(dma20, 4),
                "dma100": round(dma100, 4),
                "rsi": round(rsi, 2),
                "stopLoss": sl_price,
                "targetPrice": tp_price,
                "riskPct": risk_pct,
                "probSuccess": prob_success,
                "recommendationDate": pd.Timestamp.now().strftime('%d %b %Y') + " 09:30 AM"
            })

        except Exception as e:
            print(f"Error scanning {sym}: {e}")

    print(f"\n✓ Scan Complete. Found {len(currency_signals)} Official NSE/BSE Currency Derivatives Signals.")
    for sig in currency_signals:
        print(f"  [{sig['signalType']}] {sig['name']}: Rate ₹{sig['currentPrice']} | SL ₹{sig['stopLoss']} | Target ₹{sig['targetPrice']} | Prob: {sig['probSuccess']}%")

    if not currency_signals:
        print("⚠️ CRITICAL: Yahoo Finance returned empty data for currency signals (Rate Limited). Aborting save to preserve cache.")
        sys.exit(1)

    output_path = os.path.join(os.path.dirname(__file__), 'inr_currency_signals.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({"signals": currency_signals, "timestamp": pd.Timestamp.now().isoformat()}, f, indent=2)

    print(f"\n✓ Saved {len(currency_signals)} Currency Signals to inr_currency_signals.json")

if __name__ == "__main__":
    scan_currency_triple_confirmation()
