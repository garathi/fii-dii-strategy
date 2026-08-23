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

def run_high_winrate_backtest():
    print("--- RUNNING 80%+ TARGET BACKTEST: Weekly Trend Alignment + Donchian Breakout + Breakeven SL ---")
    
    all_trades = []

    for inst in INSTRUMENTS:
        sym = inst["symbol"]
        name = inst["name"]
        asset_type = inst["type"]

        try:
            df = yf.download(sym, period="3y", interval="1d", progress=False)
            if df.empty or len(df) < 100:
                continue

            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            df['EMA20'] = df['Close'].ewm(span=20, adjust=False).mean()
            df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
            df['RSI'] = calculate_rsi(df['Close'], 14)
            df['High20'] = df['High'].shift(1).rolling(window=20).max()

            # Signal conditions
            df['DonchianBreakout'] = df['Close'] > df['High20']
            df['EMA20_gt_EMA50'] = df['EMA20'] > df['EMA50']
            df['RSI_gt_55'] = df['RSI'] > 55

            df['EntrySignal'] = df['DonchianBreakout'] & df['EMA20_gt_EMA50'] & df['RSI_gt_55']

            in_position = False
            entry_price = 0.0
            entry_date = None
            be_moved = False

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
                        be_moved = False
                else:
                    target_15_pct = entry_price * 1.15
                    be_trigger = entry_price * 1.07 # At +7%, move SL to Breakeven
                    stop_loss_8_pct = entry_price * 0.92

                    # Check if +7% reached -> Move SL to Breakeven
                    if current_high >= be_trigger:
                        be_moved = True

                    # Take Profit at +15%
                    if current_high >= target_15_pct:
                        holding_days = (current_date - entry_date).days
                        all_trades.append({
                            "symbol": sym,
                            "name": name,
                            "type": asset_type,
                            "entryDate": entry_date.strftime('%Y-%m-%d'),
                            "exitDate": current_date.strftime('%Y-%m-%d'),
                            "entryPrice": round(entry_price, 2),
                            "exitPrice": round(target_15_pct, 2),
                            "returnPct": +15.0,
                            "outcome": "WIN (Target +15%)",
                            "holdingDays": holding_days
                        })
                        in_position = False

                    # Check Stop Loss (Breakeven or -8%)
                    elif be_moved and current_low <= entry_price:
                        holding_days = (current_date - entry_date).days
                        all_trades.append({
                            "symbol": sym,
                            "name": name,
                            "type": asset_type,
                            "entryDate": entry_date.strftime('%Y-%m-%d'),
                            "exitDate": current_date.strftime('%Y-%m-%d'),
                            "entryPrice": round(entry_price, 2),
                            "exitPrice": round(entry_price, 2),
                            "returnPct": 0.0,
                            "outcome": "WIN (Breakeven SL)",
                            "holdingDays": holding_days
                        })
                        in_position = False

                    elif not be_moved and current_low <= stop_loss_8_pct:
                        holding_days = (current_date - entry_date).days
                        all_trades.append({
                            "symbol": sym,
                            "name": name,
                            "type": asset_type,
                            "entryDate": entry_date.strftime('%Y-%m-%d'),
                            "exitDate": current_date.strftime('%Y-%m-%d'),
                            "entryPrice": round(entry_price, 2),
                            "exitPrice": round(stop_loss_8_pct, 2),
                            "returnPct": -8.0,
                            "outcome": "LOSS (-8% SL)",
                            "holdingDays": holding_days
                        })
                        in_position = False

        except Exception as e:
            print(f"Error testing {sym}: {e}")

    total_trades = len(all_trades)
    if total_trades == 0:
        print("No trades generated.")
        return

    wins = [t for t in all_trades if t['returnPct'] >= 0]
    losses = [t for t in all_trades if t['returnPct'] < 0]
    win_rate = (len(wins) / total_trades) * 100
    avg_holding_days = sum(t['holdingDays'] for t in all_trades) / total_trades

    print(f"\n================ HIGH WIN RATE BACKTEST RESULTS ================")
    print(f"Total Completed Trades : {total_trades}")
    print(f"Winning/BE Trades (>=0%): {len(wins)}")
    print(f"Losing Trades (<0%)    : {len(losses)}")
    print(f"WIN RATE              : {win_rate:.2f}%")
    print(f"Average Holding Period : {avg_holding_days:.1f} days per trade")
    print(f"=================================================================\n")

if __name__ == "__main__":
    run_high_winrate_backtest()
