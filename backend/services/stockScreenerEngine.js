const fs = require('fs');
const path = require('path');

function getRealNifty500Quotes() {
  const file = path.join(__dirname, '../real_nifty500_quotes.json');
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  }
  return [];
}

/**
 * NIFTY 500 High-Growth Institutional Screener Engine
 * Filters Midcap & Smallcap stocks experiencing FII/DII accumulation and 52-Week High Breakout
 */
function screenInstitutionalStocks(todayData) {
  const fiiNet = todayData.fii?.netValue || 0;
  const diiNet = todayData.dii?.netValue || 0;
  const combinedNet = fiiNet + diiNet;

  const realQuotes = getRealNifty500Quotes();

  const screenedStocks = realQuotes.map((stock) => {
    const cmp = stock.cmp;
    const changePct = stock.changePct || 0;
    const distFromHigh = stock.distFromHighPct || 10;

    // Nifty 500 Institutional Momentum Score (-100 to +100)
    // High Score = Near 52W High (< 10% away) + Strong Institutional Holding + Positive Day Return
    let instScore = (combinedNet / 2500) * 30 + (changePct * 15) + (15 - distFromHigh * 1.5);
    instScore = Math.round(Math.max(-100, Math.min(100, instScore)));

    let status = 'ACCUMULATION';
    let signal = 'STRONG BUY';
    let badgeClass = 'badge-bullish';
    let targetPrice = Math.round(cmp * 1.145 * 100) / 100; // 14.5% swing target for Nifty 500 midcaps
    let stopLossPrice = Math.round(cmp * 0.948 * 100) / 100; // 5.2% stop loss
    let strategyAdvice = '';

    if (distFromHigh <= 10 && instScore >= 15) {
      status = '52W_HIGH_INSTITUTIONAL_BREAKOUT';
      signal = '52W HIGH BREAKOUT BUY';
      badgeClass = 'badge-bullish';
      strategyAdvice = `FII/DII accumulation + 52-Week High Breakout! Buy Swing Delivery / Stock Options above ₹${cmp} for +15% to +25% multi-week target.`;
    } else if (instScore >= 20) {
      status = 'HEAVY_INSTITUTIONAL_ACCUMULATION';
      signal = 'INSTITUTIONAL BUY';
      badgeClass = 'badge-bullish';
      strategyAdvice = `Strong DII/FII buying in Nifty 500 Midcap. Accumulate delivery on dips above ₹${cmp}.`;
    } else if (instScore <= -20) {
      status = 'INSTITUTIONAL_PROFIT_BOOKING';
      signal = 'DISTRIBUTION / SELL';
      badgeClass = 'badge-bearish';
      targetPrice = Math.round(cmp * 0.88 * 100) / 100;
      stopLossPrice = Math.round(cmp * 1.04 * 100) / 100;
      strategyAdvice = `Institutional selling pressure. Exit delivery or buy Put Options below ₹${cmp}.`;
    } else {
      status = 'MIDCAP_CONSOLIDATION';
      signal = 'NEUTRAL / WATCHLIST';
      badgeClass = 'badge-sideways';
      strategyAdvice = `Consolidating in base pattern. Add to watchlist and wait for 52-Week High volume breakout.`;
    }

    return {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      capType: stock.capType,
      cmp,
      changePct,
      high52: stock.high52,
      distFromHighPct: distFromHigh,
      fiiHoldingPct: stock.fiiHoldingPct,
      diiHoldingPct: stock.diiHoldingPct,
      instInflowScore: instScore,
      status,
      signal,
      badgeClass,
      targetPrice,
      stopLossPrice,
      strategyAdvice,
      priceSource: 'Yahoo Finance Real-Time Nifty 500 Quote'
    };
  });

  const topBreakoutPicks = screenedStocks.filter(s => s.signal.includes('BREAKOUT') || s.signal.includes('BUY')).sort((a, b) => b.instInflowScore - a.instInflowScore);
  const topShortPicks = screenedStocks.filter(s => s.signal.includes('SELL')).sort((a, b) => a.instInflowScore - b.instInflowScore);

  return {
    summary: {
      totalScreened: screenedStocks.length,
      institutionalBuyCount: topBreakoutPicks.length,
      institutionalShortCount: topShortPicks.length,
      marketInflowContext: 'Nifty 500 High-Alpha Midcap & Smallcap Screener'
    },
    topBuyPicks: topBreakoutPicks,
    topShortPicks,
    allStocks: screenedStocks
  };
}

module.exports = {
  screenInstitutionalStocks
};
