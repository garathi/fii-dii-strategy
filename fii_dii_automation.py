import math
import json
import datetime
import sys
import io

# Force UTF-8 stdout for Windows consoles
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def generate_simulated_fii_dii():
    today = datetime.date.today()
    seed = today.day * 100 + today.month * 10
    
    fii_buy = round(8500 + math.sin(seed + 1) * 3500)
    fii_sell = round(8500 + math.cos(seed + 2) * 3800)
    fii_net = fii_buy - fii_sell
    
    dii_buy = round(7800 + math.sin(seed + 3) * 3200)
    dii_sell = round(7800 + math.cos(seed + 4) * 2900)
    dii_net = dii_buy - dii_sell
    
    return {
        "date": today.strftime("%Y-%m-%d"),
        "nifty_close": 24550,
        "fii": {"buy": fii_buy, "sell": fii_sell, "net": fii_net},
        "dii": {"buy": dii_buy, "sell": dii_sell, "net": dii_net},
        "combined_net": fii_net + dii_net
    }

def analyze_sentiment(data):
    fii_net = data["fii"]["net"]
    dii_net = data["dii"]["net"]
    combined = data["combined_net"]
    nifty = data["nifty_close"]
    
    # Calculate score
    score = round(max(-100, min(100, (combined / 3000) * 80)))
    
    if fii_net > 500 and dii_net > 300:
        sentiment = "STRONG_BULLISH"
        strategy = "NIFTY Bull Call Spread"
        advice = "Deploy Bull Call Spread (BUY ATM Call, SELL OTM Call)."
    elif fii_net < -500 and dii_net < -300:
        sentiment = "STRONG_BEARISH"
        strategy = "NIFTY Bear Put Spread"
        advice = "Deploy Bear Put Spread (BUY ATM Put, SELL OTM Put)."
    elif score >= 40:
        sentiment = "BULLISH"
        strategy = "Long Call Option / Call Spread"
        advice = "Moderate Bullish inflow. Buy Call with strict Stop-Loss."
    elif score <= -40:
        sentiment = "BEARISH"
        strategy = "Long Put Option / Put Spread"
        advice = "Moderate Bearish outflow. Buy Put or Short Futures."
    else:
        sentiment = "SIDEWAYS"
        strategy = "NIFTY Iron Condor / Delta Neutral Option Selling"
        advice = "Conflicting institutional flows. Sell Strangle / Iron Condor for theta decay."

    atm_strike = round(nifty / 50) * 50

    return {
        "sentiment": sentiment,
        "score": score,
        "strategy": strategy,
        "nifty_spot": nifty,
        "atm_strike": atm_strike,
        "advice": advice
    }

def main():
    print("=" * 60)
    print(" 🚀 FII & DII INSTITUTIONAL MARKET SENTIMENT AUTOMATION 🚀")
    print(" Based on Jabalpur Share Bazar Trading Strategy Concept")
    print("=" * 60)
    
    data = generate_simulated_fii_dii()
    result = analyze_sentiment(data)
    
    print(f" Date: {data['date']}")
    print(f" Nifty Index Spot: {data['nifty_close']}")
    print("-" * 60)
    print(f" FII Net Cash Flow:  ₹{data['fii']['net']} Cr  (Buy: ₹{data['fii']['buy']} Cr, Sell: ₹{data['fii']['sell']} Cr)")
    print(f" DII Net Cash Flow:  ₹{data['dii']['net']} Cr  (Buy: ₹{data['dii']['buy']} Cr, Sell: ₹{data['dii']['sell']} Cr)")
    print(f" Combined Net Flow:  ₹{data['combined_net']} Cr")
    print("-" * 60)
    print(f" Market Sentiment:   {result['sentiment']} (Score: {result['score']}/100)")
    print(f" Recommended Trade:  {result['strategy']}")
    print(f" Nifty ATM Strike:   {result['atm_strike']}")
    print(f" Strategy Action:    {result['advice']}")
    print("=" * 60)
    print(" [✓] Strategy evaluation completed successfully.")

if __name__ == "__main__":
    main()
