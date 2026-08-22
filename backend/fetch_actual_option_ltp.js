const axios = require('axios');

async function fetchNiftyOptionChainLTP() {
  console.log('Fetching Actual Point-in-Time Nifty Option Chain LTP & OI from NSE...');
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://www.nseindia.com/option-chain'
  };

  try {
    // Session cookie initialization
    const sessionRes = await axios.get('https://www.nseindia.com/option-chain', { headers, timeout: 5000 });
    const cookies = sessionRes.headers['set-cookie'];
    
    if (cookies) {
      headers['Cookie'] = cookies.join('; ');
    }

    const ocRes = await axios.get('https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY', { headers, timeout: 5000 });
    const data = ocRes.data;
    
    if (data && data.records) {
      const underlyingValue = data.records.underlyingValue;
      const expiryDates = data.records.expiryDates;
      console.log(`✓ Underlying Nifty Spot: ₹${underlyingValue}`);
      console.log(`✓ Active Expiries: ${expiryDates.slice(0, 3).join(', ')}`);
      
      const atmStrike = Math.round(underlyingValue / 50) * 50;
      const currentExpiry = expiryDates[0];
      
      const targetStrikes = [atmStrike - 250, atmStrike, atmStrike + 250];
      
      console.log(`\nPoint-in-Time Actual Traded Option LTPs (Expiry: ${currentExpiry}):`);
      data.records.data.forEach(item => {
        if (item.expiryDate === currentExpiry && targetStrikes.includes(item.strikePrice)) {
          const ce = item.CE || {};
          const pe = item.PE || {};
          console.log(` Strike ₹${item.strikePrice} | CALL LTP: ₹${ce.lastPrice || 0} (OI: ${ce.openInterest}) | PUT LTP: ₹${pe.lastPrice || 0} (OI: ${pe.openInterest})`);
        }
      });
      return true;
    }
  } catch (err) {
    console.log('⚠️ NSE API direct fetch fallback (NSE session cookie protection active).');
    return false;
  }
}

fetchNiftyOptionChainLTP();
