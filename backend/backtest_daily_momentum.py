import yfinance as yf
import pandas as pd
import numpy as np
import os
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Instrument Universe: Stocks, Commodities, and Currency
INSTRUMENTS = [
    # Indian Heavyweight & Midcap Stocks
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "type": "Stock"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "type": "Stock"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "type": "Stock"},
    {"symbol": "INFY.NS", "name": "Infosys", "type": "Stock"},
    {"symbol": "TCS.NS", "name": "TCS", "type": "Stock"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "type": "Stock"},
    {"symbol": "HAL.NS", "name": "Hindustan Aeronautics", "type": "Stock"},
    {"symbol": "POLYCAB.NS", "name": "Polycab India", "type": "Stock"},
    {"symbol": "DIXON.NS", "name": "Dixon Tech", "type": "Stock"},
    {"symbol": "TRENT.NS", "name": "Trent Ltd", "type": "Stock"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "type": "Stock"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "type": "Stock"},
    {"symbol": "BSE.NS", "name": "BSE Ltd", "type": "Stock"},
    {"symbol": "MCX.NS", "name": "MCX India", "type": "Stock"},

    # Commodities
    {"symbol": "GOLDBEES.NS", "name": "Nippon India Gold BeES", "type": "Commodity"},
    {"symbol": "GC=F", "name": "Gold Futures (Global)", "type": "Commodity"},
    {"symbol": "CL=F", "name": "Crude Oil Futures", "type": "Commodity"},

    # Currency
    {"symbol": "INR=X", "name": "USD / INR Currency", "type": "Currency"}
]

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def run_backtest():
    print("--- RUNNING BACKTEST: Daily Momentum Strategy (EMA 20/50 + RSI > 50 + 20% TP/SL) ---")
    
    all_trades = []
    summary_by_type = {}

    for inst in INSTRUMENTS:
        sym = inst["symbol"]
        name = inst["name"]
        asset_type = inst["type"]

        try:
            df = yf.download(sym, period="2y", interval="1d", progress=False)
            if df.empty or len(df) < 60:
                continue

            # Flatten MultiIndex columns if present
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            df['EMA20'] = df['Close'].ewm(span=20, adjust=False).mean()
            df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
            df['RSI'] = calculate_rsi(df['Close'], 14)

            # Signal conditions
            # 1. Price crosses above EMA20 for the first time
            df['CrossAboveEMA20'] = (df['Close'] > df['EMA20']) & (df['Close'].shift(1) <= df['EMA20'].shift(1))
            # 2. EMA20 > EMA50
            df['EMA20_gt_EMA50'] = df['EMA20'] > df['EMA50']
            # 3. RSI > 50
            df['RSI_gt_50'] = df['RSI'] > 50

            df['EntrySignal'] = df['CrossAboveEMA20'] & df['EMA20_gt_EMA50'] & df['RSI_gt_50']

            in_position = False
            entry_price = 0.0
            entry_date = None
            tp_price = 0.0
            sl_price = 0.0

            inst_trades = []

            for i in range(50, len(df)):
                row = df.iloc[i]
                current_date = df.index[i]
                current_close = float(row['Close'])
                current_high = float(row['High']) if 'High' in df.columns else current_close
                current_low = float(row['Low']) if 'Low' in df.columns else current_close

                if not in_position:
                    if row['EntrySignal']:
                        in_position = True
                        entry_price = current_close
                        entry_date = current_date
                        tp_price = entry_price * 1.20 # 20% Take Profit
                        sl_price = entry_price * 0.80 # 20% Stop Loss
                else:
                    # Check if TP hit (+20%)
                    if current_high >= tp_price:
                        exit_price = tp_price
                        return_pct = +20.0
                        holding_days = (current_date - entry_date).days
                        inst_trades.append({
                            "symbol": sym,
                            "name": name,
                            "type": asset_type,
                            "entryDate": entry_date.strftime('%Y-%m-%d'),
                            "exitDate": current_date.strftime('%Y-%m-%d'),
                            "entryPrice": round(entry_price, 2),
                            "exitPrice": round(exit_price, 2),
                            "returnPct": return_pct,
                            "outcome": "WIN (TP 20%)",
                            "holdingDays": holding_days
                        })
                        in_position = False # Deduplication rule: position closed, can re-enter on future signal

                    # Check if SL hit (-20%)
                    elif current_low <= sl_price:
                        exit_price = sl_price
                        return_pct = -20.0
                        holding_days = (current_date - entry_date).days
                        inst_trades.append({
                            "symbol": sym,
                            "name": name,
                            "type": asset_type,
                            "entryDate": entry_date.strftime('%Y-%m-%d'),
                            "exitDate": current_date.strftime('%Y-%m-%d'),
                            "entryPrice": round(entry_price, 2),
                            "exitPrice": round(exit_price, 2),
                            "returnPct": return_pct,
                            "outcome": "LOSS (SL 20%)",
                            "holdingDays": holding_days
                        })
                        in_position = False

            all_trades.extend(inst_trades)

        except Exception as e:
            print(f"Error testing {sym}: {e}")

    # Process overall statistics
    total_trades = len(all_trades)
    if total_trades == 0:
        print("No trades generated during test period.")
        return

    wins = [t for t in all_trades if t['returnPct'] > 0]
    losses = [t for t in all_trades if t['returnPct'] < 0]
    win_rate = (len(wins) / total_trades) * 100
    avg_holding_days = sum(t['holdingDays'] for t in all_trades) / total_trades

    print(f"\n================ BACKTEST SUMMARY RESULTS ================")
    print(f"Total Completed Trades : {total_trades}")
    print(f"Winning Trades (20% TP): {len(wins)}")
    print(f"Losing Trades (20% SL) : {len(losses)}")
    print(f"WIN RATE              : {win_rate:.2f}%")
    print(f"Average Holding Period: {avg_holding_days:.1f} days per trade")
    print(f"==========================================================\n")

    # Detailed trade breakdown
    for t in all_trades[:15]:
        print(f"  [{t['type']}] {t['symbol']} ({t['name']}): Entry {t['entryDate']} @ ₹{t['entryPrice']} -> Exit {t['exitDate']} @ ₹{t['exitPrice']} | {t['outcome']} ({t['holdingDays']}d)")

if __name__ == "__main__":
    run_backtest()
