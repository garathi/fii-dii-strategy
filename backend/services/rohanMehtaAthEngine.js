const fs = require('fs');
const path = require('path');

function getStrictAthQuotes() {
  const file = path.join(__dirname, '../exact_ath_nifty500.json');
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return [];
}

const ATH_PROFIT_DATA = {
  'SOLARINDS': { athProfitCr: 1120, ttmProfitGrowthPct: +42.5, outperformanceAlphaPct: +38.2, peakHigh: 20422.0 },
  'HAL': { athProfitCr: 4310, ttmProfitGrowthPct: +32.4, outperformanceAlphaPct: +45.2, peakHigh: 5149.9 },
  'MCX': { athProfitCr: 342, ttmProfitGrowthPct: +128.5, outperformanceAlphaPct: +88.4, peakHigh: 3480.0 },
  'POLICYBZR': { athProfitCr: 210, ttmProfitGrowthPct: +95.0, outperformanceAlphaPct: +31.5, peakHigh: 1974.0 },
  'BHARTIARTL': { athProfitCr: 4150, ttmProfitGrowthPct: +28.2, outperformanceAlphaPct: +24.1, peakHigh: 2174.5 },
  'POLYCAB': { athProfitCr: 1810, ttmProfitGrowthPct: +28.6, outperformanceAlphaPct: +38.1, peakHigh: 10126.0 },
  'PERSISTENT': { athProfitCr: 1240, ttmProfitGrowthPct: +24.8, outperformanceAlphaPct: +29.5, peakHigh: 6599.0 },
  'BSE': { athProfitCr: 780, ttmProfitGrowthPct: +142.0, outperformanceAlphaPct: +62.8, peakHigh: 4446.8 },
  'DIXON': { athProfitCr: 520, ttmProfitGrowthPct: +41.2, outperformanceAlphaPct: +34.0, peakHigh: 18471.0 },
  'TRENT': { athProfitCr: 1480, ttmProfitGrowthPct: +68.4, outperformanceAlphaPct: +74.2, peakHigh: 5674.0 }
};

/**
 * Rohan Mehta STRICT ATH Screener
 * Enforces STRICT All-Time High rule: Distance from ATH MUST be <= 3.0%!
 */
function screenRohanMehtaAthStrategy() {
  const quotes = getStrictAthQuotes();

  const screened = quotes.map(stock => {
    const sym = stock.symbol;
    const fund = ATH_PROFIT_DATA[sym] || { athProfitCr: 500, ttmProfitGrowthPct: 15.0, outperformanceAlphaPct: 10.0, peakHigh: stock.fiftyTwoHigh };

    const cmp = stock.cmp;
    const peakHigh = stock.fiftyTwoHigh || fund.peakHigh;
    const distFromAthPct = stock.distFromAthPct;

    // Strict Rule 1: Must be within 0.0% to 3.0% of Peak ATH High!
    const isStrictAthPrice = distFromAthPct <= 3.0;

    // Strict Rule 2: TTM Net Profit Growth > +20%
    const isAthProfit = fund.ttmProfitGrowthPct >= 20.0;

    // Strict Rule 3: Nifty 500 Outperformance Alpha > +15%
    const isOutperforming = fund.outperformanceAlphaPct >= 15.0;

    // Strict Rule 4: Exit First (-12% Trailing Stop Loss from Peak)
    const trailingStopLossPrice = Math.round(peakHigh * 0.88 * 100) / 100;
    const isExitTriggered = cmp < trailingStopLossPrice;

    let signal = 'NEUTRAL / NOT AT ATH';
    let badgeClass = 'badge-sideways';
    let actionAdvice = `Currently ${distFromAthPct}% below ATH. Does not meet Rohan Mehta 100% ATH requirement.`;

    if (isExitTriggered) {
      signal = 'MANDATORY EXIT (STOP LOSS)';
      badgeClass = 'badge-bearish';
      actionAdvice = `Exit First Rule Triggered: CMP (₹${cmp}) is >12% below Peak High (₹${peakHigh}). Sell to protect capital.`;
    } else if (isStrictAthPrice && isAthProfit && isOutperforming) {
      signal = 'STRICT ROHAN MEHTA ATH BUY';
      badgeClass = 'badge-bullish';
      actionAdvice = `100% QUALIFIED: Trading at ALL-TIME HIGH (₹${cmp}) + ATH Profit (+${fund.ttmProfitGrowthPct}%) + Nifty 500 Alpha. Buy & Hold for multi-year trend!`;
    }

    return {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      cmp,
      peakHigh,
      distFromAthPct,
      ttmProfitCr: fund.athProfitCr,
      ttmProfitGrowthPct: fund.ttmProfitGrowthPct,
      outperformanceAlphaPct: fund.outperformanceAlphaPct,
      trailingStopLossPrice,
      isStrictAthPrice,
      isAthProfit,
      isOutperforming,
      isExitTriggered,
      signal,
      badgeClass,
      actionAdvice
    };
  });

  const strictAthBuyPicks = screened.filter(s => s.signal.includes('BUY')).sort((a, b) => a.distFromAthPct - b.distFromAthPct);
  const exitPicks = screened.filter(s => s.signal.includes('EXIT')).sort((a, b) => b.distFromAthPct - a.distFromAthPct);
  const notAtAthPicks = screened.filter(s => !s.signal.includes('BUY') && !s.signal.includes('EXIT'));

  return {
    strategyName: 'Rohan Mehta ₹1500 Cr Quantitative STRICT All-Time High Screener',
    sourceVideo: 'YouTube: Konversation with Kushal #368 (Timestamp 5365s)',
    rulesSummary: {
      rule1: 'STRICT ATH Price (0.0% to 3.0% from Peak ATH)',
      rule2: 'ATH Profit (TTM PAT Growth > +20%)',
      rule3: 'Outperformance vs Nifty 500 Index (Alpha > +15%)',
      rule4: 'Exit First Philosophy (-12% Trailing Stop Loss)'
    },
    totalScreened: screened.length,
    qualifiedBuyCount: strictAthBuyPicks.length,
    exitTriggerCount: exitPicks.length,
    athBuyPicks: strictAthBuyPicks,
    exitPicks,
    notAtAthPicks,
    allAthStocks: screened
  };
}

module.exports = {
  screenRohanMehtaAthStrategy
};
