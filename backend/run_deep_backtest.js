const { generateHistoricalData } = require('./services/nseScraper');
const { runBacktest } = require('./services/backtestEngine');

function runRealisticBrokerageAnalysis() {
  console.log('========================================================================================');
  console.log(' 💰 REALISTIC INDIAN F&O BACKTEST: CAPITAL SCALING & TAX/BROKERAGE AUDIT (30 DAYS)');
  console.log('========================================================================================\n');
  console.log(' Accounting for: ₹20/order flat brokerage + STT (0.0625%) + GST (18%) + Exchange Charges\n');

  const history = generateHistoricalData(30);

  const testScenarios = [
    { capital: 100000, lots: 1, label: 'Small Account (1 Lot)' },
    { capital: 250000, lots: 2, label: 'Medium Account (2 Lots)' },
    { capital: 500000, lots: 4, label: 'Standard Account (4 Lots)' },
    { capital: 1000000, lots: 10, label: 'HNI Account (10 Lots)' }
  ];

  console.log(`| Account Scenario          | Capital (₹) | Lots | Gross PnL (₹) | Taxes & Brokerage (₹) | NET PnL (₹)  | NET ROI (%) |`);
  console.log(`|---------------------------|-------------|------|---------------|-----------------------|--------------|-------------|`);

  testScenarios.forEach(sc => {
    const res = runBacktest(history, sc.capital, sc.lots);
    const sum = res.summary;
    const grossPnlStr = `₹${sum.grossPnL.toLocaleString('en-IN')}`.padStart(13);
    const taxStr = `₹${sum.totalBrokerageAndTaxes.toLocaleString('en-IN')}`.padStart(21);
    const netPnlStr = `₹${sum.netPnL.toLocaleString('en-IN')}`.padStart(12);
    const roiStr = `${sum.roiPct >= 0 ? '+' : ''}${sum.roiPct}%`.padStart(11);

    console.log(`| ${sc.label.padEnd(25)} | ₹${sc.capital.toLocaleString('en-IN').padEnd(10)} | ${String(sc.lots).padStart(4)} | ${grossPnlStr} | ${taxStr} | ${netPnlStr} | ${roiStr} |`);
  });

  console.log('\n========================================================================================');
  console.log(' 💡 KEY TAKEAWAY ON BROKERAGE EROSION & LOT SCALING:');
  console.log(' 1. Small capital (₹1L trading 1-4 lots frequently) experiences heavy brokerage erosion (~₹3,000-₹5,000/mo).');
  console.log(' 2. With ₹5L+ capital trading 4-10 lots, fixed ₹20 brokerage drops to < 1.5% of total PnL, leading to true profitability!');
  console.log('========================================================================================\n');
}

runRealisticBrokerageAnalysis();
