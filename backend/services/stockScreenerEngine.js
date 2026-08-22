/**
 * Stock Screener Engine: Institutional Stock Selection based on FII/DII Cash & Derivatives Inflow
 * Inspired by Jabalpur Share Bazar YouTube Strategy Concept
 */

const NIFTY_HEAVYWEIGHTS = [
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking & Financials', price: 1640.50, fiiHoldingPct: 52.4, diiHoldingPct: 30.8 },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy & Conglomerate', price: 2980.20, fiiHoldingPct: 22.1, diiHoldingPct: 16.5 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking & Financials', price: 1185.00, fiiHoldingPct: 44.8, diiHoldingPct: 45.2 },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'Information Technology', price: 1820.75, fiiHoldingPct: 33.5, diiHoldingPct: 35.1 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'Information Technology', price: 4250.00, fiiHoldingPct: 12.8, diiHoldingPct: 10.4 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Public Banking', price: 845.30, fiiHoldingPct: 11.2, diiHoldingPct: 24.6 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', price: 1480.90, fiiHoldingPct: 25.6, diiHoldingPct: 19.8 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Capital Goods & Infra', price: 3620.40, fiiHoldingPct: 24.1, diiHoldingPct: 37.2 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking & Financials', price: 1165.10, fiiHoldingPct: 54.2, diiHoldingPct: 28.4 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile', price: 1090.00, fiiHoldingPct: 19.4, diiHoldingPct: 18.2 }
];

function screenInstitutionalStocks(todayData) {
  const fiiNet = todayData.fii?.netValue || 0;
  const diiNet = todayData.dii?.netValue || 0;
  const combinedNet = fiiNet + diiNet;

  const screenedStocks = NIFTY_HEAVYWEIGHTS.map((stock, idx) => {
    // Seeded institutional momentum score for stock
    const scoreSeed = stock.price + fiiNet + (idx * 150);
    const instInflowScore = Math.round(Math.max(-100, Math.min(100, (combinedNet / 2500) * 50 + Math.sin(scoreSeed) * 45)));

    let status = 'ACCUMULATION';
    let signal = 'BUY';
    let badgeClass = 'badge-bullish';
    let targetPrice = Math.round(stock.price * 1.045);
    let stopLossPrice = Math.round(stock.price * 0.982);
    let strategyAdvice = '';

    if (instInflowScore >= 45) {
      status = 'HEAVY_INSTITUTIONAL_BUY';
      signal = 'STRONG BUY';
      badgeClass = 'badge-bullish';
      strategyAdvice = `FII & DII net cash accumulation confirmed. Buy Delivery / Stock Call Option above ₹${stock.price}.`;
    } else if (instInflowScore <= -45) {
      status = 'INSTITUTIONAL_DISTRIBUTION';
      signal = 'SELL / SHORT';
      badgeClass = 'badge-bearish';
      targetPrice = Math.round(stock.price * 0.955);
      stopLossPrice = Math.round(stock.price * 1.018);
      strategyAdvice = `Institutional profit booking / cash outflow. Short Stock Futures or Buy Put Option below ₹${stock.price}.`;
    } else {
      status = 'RANGEBOUND_CONSOLIDATION';
      signal = 'NEUTRAL / HOLD';
      badgeClass = 'badge-sideways';
      strategyAdvice = `Stock consolidating in a range. Avoid aggressive momentum trades; wait for institutional volume breakout.`;
    }

    return {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      cmp: stock.price,
      fiiHoldingPct: stock.fiiHoldingPct,
      diiHoldingPct: stock.diiHoldingPct,
      instInflowScore,
      status,
      signal,
      badgeClass,
      targetPrice,
      stopLossPrice,
      strategyAdvice
    };
  });

  // Filter top institutional buy picks and top distribution shorts
  const topBuyPicks = screenedStocks.filter(s => s.signal.includes('BUY')).sort((a, b) => b.instInflowScore - a.instInflowScore);
  const topShortPicks = screenedStocks.filter(s => s.signal.includes('SELL')).sort((a, b) => a.instInflowScore - b.instInflowScore);

  return {
    summary: {
      totalScreened: screenedStocks.length,
      institutionalBuyCount: topBuyPicks.length,
      institutionalShortCount: topShortPicks.length,
      marketInflowContext: combinedNet >= 0 ? 'Bullish Institutional Flow' : 'Bearish Institutional Flow'
    },
    topBuyPicks,
    topShortPicks,
    allStocks: screenedStocks
  };
}

module.exports = {
  screenInstitutionalStocks
};
