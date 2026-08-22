import requests
import json
import os
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Representative Nifty 500 High-Growth Stock Universe
NIFTY500_UNIVERSE = [
    {"symbol": "BSE", "yahoo": "BSE.NS", "name": "BSE Limited", "sector": "Capital Markets"},
    {"symbol": "MCX", "yahoo": "MCX.NS", "name": "Multi Commodity Exchange", "sector": "Capital Markets"},
    {"symbol": "CDSL", "yahoo": "CDSL.NS", "name": "Central Depository Services", "sector": "Capital Markets"},
    {"symbol": "BHARTIARTL", "yahoo": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd", "sector": "Telecom"},
    {"symbol": "ZOMATO", "yahoo": "ZOMATO.NS", "name": "Zomato Ltd", "sector": "Consumer Tech"},
    {"symbol": "POLICYBZR", "yahoo": "POLICYBZR.NS", "name": "PB Fintech Ltd", "sector": "Fintech"},
    {"symbol": "SOLARINDS", "yahoo": "SOLARINDS.NS", "name": "Solar Industries India", "sector": "Chemicals & Explosives"},
    {"symbol": "DIXON", "yahoo": "DIXON.NS", "name": "Dixon Technologies Ltd", "sector": "EMS & Electronics"},
    {"symbol": "TRENT", "yahoo": "TRENT.NS", "name": "Trent Ltd", "sector": "Retail"},
    {"symbol": "BEL", "yahoo": "BEL.NS", "name": "Bharat Electronics Ltd", "sector": "Defence"},
    {"symbol": "HAL", "yahoo": "HAL.NS", "name": "Hindustan Aeronautics Ltd", "sector": "Defence"},
    {"symbol": "POLYCAB", "yahoo": "POLYCAB.NS", "name": "Polycab India Ltd", "sector": "Cables"},
    {"symbol": "TATAINVEST", "yahoo": "TATAINVEST.NS", "name": "Tata Investment Corp", "sector": "Finance"},
    {"symbol": "PERSISTENT", "yahoo": "PERSISTENT.NS", "name": "Persistent Systems", "sector": "IT Services"},
    {"symbol": "KAYNES", "yahoo": "KAYNES.NS", "name": "Kaynes Technology", "sector": "Electronics"}
]

def scan_exact_ath_nifty500():
    print("Scanning NIFTY 500 Universe for STRICT 100% ALL-TIME HIGH (ATH) Stocks...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    strict_ath_stocks = []

    for s in NIFTY500_UNIVERSE:
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{s['yahoo']}?range=2y&interval=1d"
            resp = requests.get(url, headers=headers, timeout=5)
            data = resp.json()
            
            result = data["chart"]["result"][0]
            meta = result["meta"]
            cmp_price = round(meta["regularMarketPrice"], 2)
            fifty_two_high = round(meta.get("fiftyTwoWeekHigh", cmp_price), 2)
            
            # Exact distance from ATH (%)
            dist_from_ath_pct = round(((fifty_two_high - cmp_price) / fifty_two_high) * 100, 2)
            
            # Strict ATH Rule: Must be within 0.0% to 1.5% of Peak ATH High!
            is_strict_ath = dist_from_ath_pct <= 1.5

            strict_ath_stocks.append({
                "symbol": s["symbol"],
                "name": s["name"],
                "sector": s["sector"],
                "cmp": cmp_price,
                "fiftyTwoHigh": fifty_two_high,
                "distFromAthPct": dist_from_ath_pct,
                "isStrictAth": is_strict_ath
            })

            status_str = "🔥 STRICT ALL-TIME HIGH!" if is_strict_ath else f"{dist_from_ath_pct}% below ATH"
            print(f"  - {s['symbol']}: CMP ₹{cmp_price} | High ₹{fifty_two_high} ({status_str})")

        except Exception as e:
            print(f"  ❌ Error scanning {s['symbol']}: {e}")

    out_file = os.path.join(os.path.dirname(__file__), "exact_ath_nifty500.json")
    with open(out_file, "w") as f:
        json.dump(strict_ath_stocks, f, indent=2)
        
    exact_count = len([x for x in strict_ath_stocks if x["isStrictAth"]])
    print(f"\n✓ Scan complete: Found {exact_count} stocks trading at STRICT ALL-TIME HIGH!")

if __name__ == "__main__":
    scan_exact_ath_nifty500()
