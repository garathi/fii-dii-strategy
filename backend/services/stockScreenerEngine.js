/**
 * Nifty 500 High-Growth Institutional Stock Screener Engine
 * Reads real_nifty500_screener.json directly with unique live prices & 1-day changes
 */

const fs = require('fs');
const path = require('path');

const realScreenerPath = path.join(__dirname, '../real_nifty500_screener.json');

function screenInstitutionalStocks(todayData) {
  let stocks = [];

  if (fs.existsSync(realScreenerPath)) {
    try {
      const raw = fs.readFileSync(realScreenerPath, 'utf-8');
      const parsed = JSON.parse(raw);
      stocks = parsed.stocks || [];
    } catch (e) {}
  }

  return {
    stocksCount: stocks.length,
    allStocks: stocks,
    topBuyPicks: stocks.filter(s => s.signal.includes('BUY')),
    topShortPicks: stocks.filter(s => s.signal.includes('SELL')),
    summary: {
      totalScreened: stocks.length,
      institutionalBuyCount: stocks.filter(s => s.signal.includes('BUY')).length,
      institutionalShortCount: stocks.filter(s => s.signal.includes('SELL')).length,
      marketInflowContext: "Nifty 500 High-Alpha Midcap & Smallcap Screener"
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  screenInstitutionalStocks
};
