/**
 * Automated Data Sync Worker for Rohan Mehta ATH Strategy
 * 
 * Update Frequency Schedule:
 * 1. ATH Prices & Live CMP: Real-time (Every 10 seconds during market hours)
 * 2. Nifty 500 Relative Outperformance Alpha: Daily EOD (At 3:45 PM IST)
 * 3. ATH Quarterly Net Profits (PAT): Quarterly Corporate Earnings Cycle (Auto-synced with SEBI Filings)
 */

const { exec } = require('child_process');
const path = require('path');

function syncAthPricesRealtime() {
  console.log('🔄 [REAL-TIME ATH SYNC]: Fetching live prices and updating 52W/ATH Highs...');
  const script = path.join(__dirname, '../scan_exact_ath_nifty500.py');
  exec(`python "${script}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('⚠️ ATH Sync error:', error.message);
      return;
    }
    console.log('✓ [REAL-TIME ATH SYNC COMPLETE]: Updated Nifty 500 prices & ATH distances.');
  });
}

module.exports = {
  syncAthPricesRealtime
};
