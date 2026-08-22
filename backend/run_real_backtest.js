const { getRealNiftyHistory, runRealBacktest } = require('./services/backtestEngine');

function executeRealMarketBacktest() {
  const realHistory = getRealNiftyHistory();

  console.log('========================================================================================');
  console.log(' 📈 100% REAL HISTORICAL MARKET BACKTEST (NIFTY 50 DATA FROM YAHOO FINANCE ^NSEI)');
  console.log('========================================================================================\n');
  console.log(` Total Real Daily Candles Analyzed: ${realHistory.length} Trading Days (Aug 2025 - Aug 2026)`);
  console.log(` Starting Nifty Price: ₹${realHistory[0]?.close} | Latest Nifty Price: ₹${realHistory[realHistory.length - 1]?.close}`);
  console.log(` Exact Nifty Contract Lot Size: 65 Quantity per Lot\n`);

  const scenarios = [
    { capital: 200000, lots: 1, label: '1 Lot (65 Quantity)' },
    { capital: 400000, lots: 2, label: '2 Lots (130 Quantity)' },
    { capital: 800000, lots: 4, label: '4 Lots (260 Quantity)' },
    { capital: 2000000, lots: 10, label: '10 Lots (650 Quantity)' }
  ];

  console.log(`| Scenario                 | Capital (₹) | Lots | Quantity | Win Rate (%) | NET Profit (₹)  | NET ROI (%) | Max Drawdown |`);
  console.log(`|--------------------------|-------------|------|----------|--------------|-----------------|-------------|--------------|`);

  scenarios.forEach(sc => {
    const res = runRealBacktest(realHistory, sc.capital, sc.lots, 65);
    const sum = res.summary;

    const capStr = `₹${sc.capital.toLocaleString('en-IN')}`.padEnd(11);
    const lotsStr = String(sc.lots).padStart(4);
    const qtyStr = String(sum.totalQuantity).padStart(8);
    const winStr = `${sum.winRate}%`.padStart(12);
    const netPnlStr = `₹${sum.netPnL.toLocaleString('en-IN')}`.padStart(15);
    const roiStr = `${sum.roiPct >= 0 ? '+' : ''}${sum.roiPct}%`.padStart(11);
    const ddStr = `-${sum.maxDrawdownPct}%`.padStart(12);

    console.log(`| ${sc.label.padEnd(24)} | ${capStr} | ${lotsStr} | ${qtyStr} | ${winStr} | ${netPnlStr} | ${roiStr} | ${ddStr} |`);
  });

  console.log('\n========================================================================================');
  console.log(' 📜 RECENT 10 REAL TRADES (AUG 2026 SESSIONS):');
  console.log('========================================================================================\n');

  const test1 = runRealBacktest(realHistory.slice(-30), 400000, 2, 65);
  console.log(`| Date       | Nifty Close | Point Move | Strategy Used        | Gross PnL (₹) | Taxes (₹) | NET PnL (₹) | Capital (₹)   |`);
  console.log(`|------------|-------------|------------|----------------------|---------------|-----------|-------------|---------------|`);

  test1.trades.slice(-10).forEach(t => {
    const dStr = t.entryDate.padEnd(10);
    const nClose = String(t.niftyClose).padStart(11);
    const moveStr = `${t.niftyPointMove >= 0 ? '+' : ''}${t.niftyPointMove}`.padStart(10);
    const stratStr = t.strategyUsed.substring(0, 20).padEnd(20);
    const grossStr = `₹${t.grossPnl}`.padStart(13);
    const taxStr = `₹${t.taxAndBrokerage}`.padStart(9);
    const netStr = `₹${t.netPnl}`.padStart(11);
    const capStr = `₹${t.capitalAfter.toLocaleString('en-IN')}`.padStart(13);

    console.log(`| ${dStr} | ${nClose} | ${moveStr} | ${stratStr} | ${grossStr} | ${taxStr} | ${netStr} | ${capStr} |`);
  });

  console.log('========================================================================================\n');
}

executeRealMarketBacktest();
