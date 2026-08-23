import yfinance as yf
import pandas as pd
import numpy as np
import os
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Instrument Universe: Positional Stocks, Commodities, and Currency
INSTRUMENTS = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "type": "Stock"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "type": "Stock"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "type": "Stock"},
    {"symbol": "INFY.NS", "name": "Infosys", "type": "Stock"},
    {"symbol": "TCS.NS", "name": "TCS", "type": "Stock"},
    {"symbol": "HAL.NS", "name": "Hindustan Aeronautics", "type": "Stock"},
    {"symbol": "POLYCAB.NS", "name": "Polycab India", "type": "Stock"},
    {"symbol": "DIXON.NS", "name": "Dixon Tech", "type": "Stock"},
    {"symbol": "TRENT.NS", "name": "Trent Ltd", "type": "Stock"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "type": "Stock"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "type": "Stock"},
    {"symbol": "BSE.NS", "name": "BSE Ltd", "type": "Stock"},
    {"symbol": "MCX.NS", "name": "MCX India", "type": "Stock"},
    {"symbol": "GOLDBEES.NS", "name": "Gold BeES", "type": "Commodity"},
    {"symbol": "GC=F", "name": "Gold Futures", "type": "Commodity"},
    {"symbol": "CL=F", "name": "Crude Oil Futures", "type": "Commodity"},
    {"symbol": "INR=X", "name": "USD / INR Currency", "type": "Currency"}
]

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def run_upgraded_positional_backtest():
    print("--- RUNNING UPGRADED POSITIONAL BACKTEST: Partial TP (+10%) + Breakeven SL + EMA(20) Close Exit ---")
    
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

            # Signal conditions
            df['CrossAboveEMA20'] = (df['Close'] > df['EMA20']) & (df['Close'].shift(1) <= df['EMA20'].shift(1))
            df['EMA20_gt_EMA50'] = df['EMA20'] > df['EMA50']
            df['RSI_gt_50'] = df['RSI'] > 50

            df['EntrySignal'] = df['CrossAboveEMA20'] & df['EMA20_gt_EMA50'] & df['RSI_gt_50']

            in_position = False
            entry_price = 0.0
            entry_date = None
            partial_tp_hit = False
            first_half_return = 0.0
            second_half_return = 0.0

            for i in range(50, len(df)):
                row = df.iloc[i]
                current_date = df.index[i]
                current_close = float(row['Close'])
                current_high = float(row['High']) if 'High' in df.columns else current_close
                current_low = float(row['Low']) if 'Low' in df.columns else current_close
                current_ema20 = float(row['EMA20'])

                if not in_position:
                    if row['EntrySignal']:
                        in_position = True
                        entry_price = current_close
                        entry_date = current_date
                        partial_tp_hit = False
                        first_half_return = 0.0
                        second_half_return = 0.0
                else:
                    target_10_pct = entry_price * 1.10
                    target_20_pct = entry_price * 1.20

                    # Step 1: Check Partial TP at +10%
                    if not partial_tp_hit and current_high >= target_10_pct:
                        partial_tp_hit = True
                        first_half_return = +10.0 # Lock in +10% on 50% position

                    # Step 2: Check Full Target at +20% (for remaining 50%)
                    if partial_tp_hit and current_high >= target_20_pct:
                        second_half_return = +20.0
                        total_return_pct = (first_half_return * 0.5) + (second_half_return * 0.5) # Net +15% total return
                        holding_days = (current_date - entry_date).days
                        all_trades.append({
                            "symbol": sym,
                            "name": name,
                            "type": asset_type,
                            "entryDate": entry_date.strftime('%Y-%m-%d'),
                            "exitDate": current_date.strftime('%Y-%m-%d'),
                            "entryPrice": round(entry_price, 2),
                            "exitPrice": round(target_20_pct, 2),
                            "returnPct": round(total_return_pct, 2),
                            "outcome": "FULL WIN (Target +20%)",
                            "holdingDays": holding_days
                        })
                        in_position = False

                    # Step 3: Check Breakeven SL after Partial TP hit
                    elif partial_tp_hit and current_low <= entry_price:
                        second_half_return = 0.0 # Exit second half at cost
                        total_return_pct = (first_half_return * 0.5) + (second_half_return * 0.5) # Net +5.0% profit!
                        holding_days = (current_date - entry_date).days
                        all_trades.append({
                            "symbol": sym,
                            "name": name,
                            "type": asset_type,
                            "entryDate": entry_date.strftime('%Y-%m-%d'),
                            "exitDate": current_date.strftime('%Y-%m-%d'),
                            "entryPrice": round(entry_price, 2),
                            "exitPrice": round(entry_price, 2),
                            "returnPct": round(total_return_pct, 2),
                            "outcome": "PARTIAL WIN (Breakeven SL)",
                            "holdingDays": holding_days
                        })
                        in_position = False

                    # Step 4: Check EMA 20 Daily Close Breakdown before Partial TP
                    elif not partial_tp_hit and current_close < current_ema20:
                        total_return_pct = round(((current_close - entry_price) / entry_price) * 100, 2)
                        holding_days = (current_date - entry_date).days
                        outcome = "CONTROLLED WIN (EMA 20 Exit)" if total_return_pct > 0 else "CONTROLLED LOSS (EMA 20 Exit)"
                        all_trades.append({
                            "symbol": sym,
                            "name": name,
                            "type": asset_type,
                            "entryDate": entry_date.strftime('%Y-%m-%d'),
                            "exitDate": current_date.strftime('%Y-%m-%d'),
                            "entryPrice": round(entry_price, 2),
                            "exitPrice": round(current_close, 2),
                            "returnPct": total_return_pct,
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
    avg_win_pct = sum(t['returnPct'] for t in wins) / len(wins) if wins else 0
    avg_loss_pct = sum(t['returnPct'] for t in losses) / len(losses) if losses else 0

    print(f"\n================ UPGRADED POSITIONAL BACKTEST RESULTS ================")
    print(f"Total Completed Trades : {total_trades}")
    print(f"Winning Trades         : {len(wins)}")
    print(f"Losing Trades          : {len(losses)}")
    print(f"WIN RATE              : {win_rate:.2f}%")
    print(f"Average Win Return     : +{avg_win_pct:.2f}%")
    print(f"Average Loss Return    : {avg_loss_pct:.2f}%")
    print(f"Average Holding Period : {avg_holding_days:.1f} days per trade")
    print(f"======================================================================\n")

    for t in all_trades[:15]:
        print(f"  [{t['type']}] {t['symbol']} ({t['name']}): Entry {t['entryDate']} @ ₹{t['entryPrice']} -> Exit {t['exitDate']} @ ₹{t['exitPrice']} | {t['outcome']} ({t['returnPct']}%) ({t['holdingDays']}d)")

if __name__ == "__main__":
    run_upgraded_positional_backtest()
