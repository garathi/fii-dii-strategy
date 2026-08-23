import yfinance as yf
import pandas as pd
import numpy as np
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SAMPLES = [
    {"symbol": "DIXON.NS", "name": "Dixon Tech"},
    {"symbol": "BSE.NS", "name": "BSE Ltd"},
    {"symbol": "ITC.NS", "name": "ITC Ltd"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever"},
    {"symbol": "POLYCAB.NS", "name": "Polycab India"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel"},
    {"symbol": "SBIN.NS", "name": "State Bank of India"}
]

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def print_sample_backtest():
    print("--- SAMPLE TRADE LOGS: 20 DMA + 100 DMA + RSI TRIPLE CONFIRMATION BACKTEST ---")
    
    trades = []

    for item in SAMPLES:
        sym = item["symbol"]
        name = item["name"]

        try:
            df = yf.download(sym, period="2y", interval="1d", progress=False)
            if df.empty or len(df) < 110:
                continue

            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            df['DMA20'] = df['Close'].rolling(window=20).mean()
            df['DMA100'] = df['Close'].rolling(window=100).mean()
            df['RSI'] = calculate_rsi(df['Close'], 14)

            # Bullish Signals
            df['BullSignal'] = (df['Close'] > df['DMA20']) & (df['Close'].shift(1) <= df['DMA20'].shift(1)) & (df['DMA20'] > df['DMA100']) & (df['RSI'] > 55)
            # Bearish Signals
            df['BearSignal'] = (df['Close'] < df['DMA20']) & (df['Close'].shift(1) >= df['DMA20'].shift(1)) & (df['DMA20'] < df['DMA100']) & (df['RSI'] < 45)

            in_trade = False
            for i in range(100, len(df)):
                row = df.iloc[i]
                c_date = df.index[i]
                c_close = float(row['Close'])
                c_dma20 = float(row['DMA20'])

                if not in_trade:
                    if row['BullSignal']:
                        in_trade = True
                        direction = "BUY"
                        entry_price = c_close
                        entry_date = c_date
                        sl = round(c_dma20 * 0.985, 2)
                        risk = entry_price - sl
                        tp = round(entry_price + (2.0 * risk), 2)
                    elif row['BearSignal']:
                        in_trade = True
                        direction = "SELL (SHORT)"
                        entry_price = c_close
                        entry_date = c_date
                        sl = round(c_dma20 * 1.015, 2)
                        risk = sl - entry_price
                        tp = round(entry_price - (2.0 * risk), 2)
                else:
                    high = float(row['High']) if 'High' in df.columns else c_close
                    low = float(row['Low']) if 'Low' in df.columns else c_close

                    if direction == "BUY":
                        if high >= tp:
                            holding_days = (c_date - entry_date).days
                            trades.append({
                                "name": name, "symbol": sym, "type": "BUY",
                                "entryDate": entry_date.strftime('%d-%b-%Y'),
                                "exitDate": c_date.strftime('%d-%b-%Y'),
                                "entry": entry_price, "sl": sl, "tp": tp, "exit": tp,
                                "pnl": round(((tp - entry_price)/entry_price)*100, 2),
                                "outcome": "WIN (Target Hit)", "days": holding_days
                            })
                            in_trade = False
                        elif low <= sl:
                            holding_days = (c_date - entry_date).days
                            trades.append({
                                "name": name, "symbol": sym, "type": "BUY",
                                "entryDate": entry_date.strftime('%d-%b-%Y'),
                                "exitDate": c_date.strftime('%d-%b-%Y'),
                                "entry": entry_price, "sl": sl, "tp": tp, "exit": sl,
                                "pnl": round(((sl - entry_price)/entry_price)*100, 2),
                                "outcome": "LOSS (SL Hit)", "days": holding_days
                            })
                            in_trade = False

                    elif direction == "SELL (SHORT)":
                        if low <= tp:
                            holding_days = (c_date - entry_date).days
                            trades.append({
                                "name": name, "symbol": sym, "type": "SELL (SHORT)",
                                "entryDate": entry_date.strftime('%d-%b-%Y'),
                                "exitDate": c_date.strftime('%d-%b-%Y'),
                                "entry": entry_price, "sl": sl, "tp": tp, "exit": tp,
                                "pnl": round(((entry_price - tp)/entry_price)*100, 2),
                                "outcome": "WIN (Target Hit)", "days": holding_days
                            })
                            in_trade = False
                        elif high >= sl:
                            holding_days = (c_date - entry_date).days
                            trades.append({
                                "name": name, "symbol": sym, "type": "SELL (SHORT)",
                                "entryDate": entry_date.strftime('%d-%b-%Y'),
                                "exitDate": c_date.strftime('%d-%b-%Y'),
                                "entry": entry_price, "sl": sl, "tp": tp, "exit": sl,
                                "pnl": round(((entry_price - sl)/entry_price)*100, 2),
                                "outcome": "LOSS (SL Hit)", "days": holding_days
                            })
                            in_trade = False
        except Exception as e:
            pass

    print(f"\nTotal Sample Trades Processed: {len(trades)}")
    wins = [t for t in trades if t['pnl'] > 0]
    print(f"Wins: {len(wins)} | Losses: {len(trades) - len(wins)} | Win Rate: {round((len(wins)/len(trades))*100, 1)}%\n")

    print(f"{'Stock Name':<20} | {'Type':<12} | {'Entry Date':<11} | {'Entry (₹)':<9} | {'SL (₹)':<8} | {'TP (₹)':<8} | {'Exit Date':<11} | {'Outcome':<18} | {'P&L %'}")
    print("-" * 115)
    for t in trades:
        pnl_str = f"+{t['pnl']}%" if t['pnl'] > 0 else f"{t['pnl']}%"
        print(f"{t['name']:<20} | {t['type']:<12} | {t['entryDate']:<11} | {t['entry']:<9.2f} | {t['sl']:<8.2f} | {t['tp']:<8.2f} | {t['exitDate']:<11} | {t['outcome']:<18} | {pnl_str}")

if __name__ == "__main__":
    print_sample_backtest()
