import math
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Standard Normal CDF N(x) using pure math.erf
def N(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def black_scholes_call(S, K, T, r, sigma):
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    call = S * N(d1) - K * math.exp(-r * T) * N(d2)
    delta = N(d1)
    return round(call, 2), round(delta, 3)

def black_scholes_put(S, K, T, r, sigma):
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    put = K * math.exp(-r * T) * N(-d2) - S * N(-d1)
    delta = N(d1) - 1.0
    return round(put, 2), round(delta, 3)

def main():
    S = 24200.0   # Nifty Spot
    K_atm = 24200.0 # ATM Strike
    K_otm_ce = 24500.0 # OTM Call Strike
    K_otm_pe = 23900.0 # OTM Put Strike
    T = 4 / 365.0   # 4 days to weekly Thursday expiry
    r = 0.0675      # 6.75% Interest rate
    sigma = 0.13    # 13% India VIX

    call_atm, delta_call_atm = black_scholes_call(S, K_atm, T, r, sigma)
    call_otm, delta_call_otm = black_scholes_call(S, K_otm_ce, T, r, sigma)
    put_otm, delta_put_otm = black_scholes_put(S, K_otm_pe, T, r, sigma)

    print("==================================================================")
    print(" 🧮 BLACK-SCHOLES OPTION PRICING MODEL FOR NIFTY 50")
    print("==================================================================")
    print(f" Nifty Spot (S):          ₹{S}")
    print(f" Days to Expiry (T):      4 Days")
    print(f" India VIX (sigma):       13.0%")
    print("------------------------------------------------------------------")
    print(f" ATM Call (24,200 CE):    Price = ₹{call_atm}  | Delta = {delta_call_atm}")
    print(f" OTM Call (24,500 CE):    Price = ₹{call_otm}   | Delta = {delta_call_otm}")
    print(f" OTM Put  (23,900 PE):    Price = ₹{put_otm}   | Delta = {delta_put_otm}")
    print("------------------------------------------------------------------")
    
    # Net Bull Call Spread (Buy 24200 CE, Sell 24500 CE)
    net_spread_cost = round(call_atm - call_otm, 2)
    net_spread_delta = round(delta_call_atm - delta_call_otm, 3)
    
    print(f" Bull Call Spread Net Premium: ₹{net_spread_cost} / share (₹{round(net_spread_cost * 65, 2)} / lot)")
    print(f" Bull Call Spread Net Delta:   {net_spread_delta}")
    print("==================================================================")

if __name__ == "__main__":
    main()
