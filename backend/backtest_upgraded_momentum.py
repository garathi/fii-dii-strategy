import yfinance as yf
import pandas as pd
import numpy as np
import os
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

INSTRUMENTS = [
    {"symbol": "RELIANCE.NS", "name": "Reliance", "type": "Stock"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "type": "Stock"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "type": "Stock"},
    {"symbol": "INFY.NS", "name": "Infosys", "type": "Stock"},
    {"symbol": "TCS.NS", "name": "TCS", "type": "Stock"},
    {"symbol": "HAL.NS", "name": "HAL", "type": "Stock"},
    {"symbol": "POLYCAB.NS", "name": "Polycab", "type": "Stock"},
    {"symbol": "DIXON.NS", "name": "Dixon Tech", "type": "Stock"},
    {"symbol": "TRENT.NS", "name": "Trent Ltd", "type": "Stock"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "type": "Stock"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "type": "Stock"},
    {"symbol": "BSE.NS", "name": "BSE Ltd", "type": "Stock"},
    {"symbol": "MCX.NS", "name": "MCX India", "type": "Stock"},
    {"symbol": "GOLDBEES.NS", "name": "Gold BeES", "type": "Commodity"},
    {"symbol": "INR=X", "name": "USD-INR", "type": "Currency"}
]

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def run_upgraded_backtest():
    print("--- RUNNING UPGRADED BACKTEST: Volume Filter + Trailing Stop Loss ---")
    
    all_trades = []

    for inst in INSTRUMENTS:
        sym = inst["symbol"]
        name = inst["name"]
        asset_type = inst["type"]

        try:
            df = yf.download(sym, period="2y", interval="1d", progress=False)
            if df.empty or len(df) < 60:
                continue

            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            df['EMA20'] = df['Close'].ewm(span=20, adjust=False).mean()
            df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
            df['RSI'] = calculate_rsi(df['Close'], 14)
            df['VolMA20'] = df['Volume'].rolling(window=20).mean()

            # Signal conditions:
            # 1. Price crosses above EMA20
            df['CrossAboveEMA20'] = (df['Close'] > df['EMA20']) & (df['Close'].shift(1) <= df['EMA20'].shift(1))
            # 2. EMA20 > EMA50
            df['EMA20_gt_EMA50'] = df['EMA20'] > df['EMA50']
            # 3. RSI > 50
            df['RSI_gt_50'] = df['RSI'] > 50
            # 4. Volume > 1.2x 20-MA volume
            df['Vol_Spike'] = df['Volume'] >= (df['VolMA20'] * 1.1)

            df['EntrySignal'] = df['CrossAboveEMA20'] & df['EMA20_gt_EMA50'] & df['RSI_gt_50'] & df['Vol_Spike']

            in_position = False
            entry_price = 0.0
            entry_date = None
            tp_price = 0.0
            highest_price = 0.0

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
                        highest_price = current_high
                else:
                    highest_price = max(highest_price, current_high)
                    trailing_sl_price = highest_price * 0.90 # Trailing SL -10% from peak

                    # Take Profit hit (+20%)
                    if current_high >= tp_price:
                        exit_price = tp_price
                        return_pct = +20.0
                        holding_days = (current_date - entry_date).days
                        all_trades.append({
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
                        in_position = False

                    # Trailing Stop Loss hit
                    elif current_low <= trailing_sl_price:
                        exit_price = trailing_sl_price
                        return_pct = round(((exit_price - entry_price) / entry_price) * 100, 2)
                        holding_days = (current_date - entry_date).days
                        outcome = "WIN (Trailing SL)" if return_pct > 0 else "LOSS (Trailing SL)"
                        all_trades.append({
                            "symbol": sym,
                            "name": name,
                            "type": asset_type,
                            "entryDate": entry_date.strftime('%Y-%m-%d'),
                            "exitDate": current_date.strftime('%Y-%m-%d'),
                            "entryPrice": round(entry_price, 2),
                            "exitPrice": round(exit_price, 2),
                            "returnPct": return_pct,
                            "outcome": outcome,
                            "holdingDays": holding_days
                        })
                        in_position = False

        except Exception as e:
            print(f"Error testing {sym}: {e}")

    total_trades = len(all_trades)
    if total_trades == 0:
        print("No trades generated.")
        return

    wins = [t for t in all_trades if t['returnPct'] > 0]
    losses = [t for t in all_trades if t['returnPct'] <= 0]
    win_rate = (len(wins) / total_trades) * 100
    avg_holding_days = sum(t['holdingDays'] for t in all_trades) / total_trades

    print(f"\n================ UPGRADED BACKTEST SUMMARY RESULTS ================")
    print(f"Total Completed Trades : {total_trades}")
    print(f"Winning Trades         : {len(wins)}")
    print(f"Losing Trades          : {len(losses)}")
    print(f"WIN RATE              : {win_rate:.2f}%")
    print(f"Average Holding Period: {avg_holding_days:.1f} days per trade")
    print(f"===================================================================\n")

if __name__ == "__main__":
    run_upgraded_backtest()
