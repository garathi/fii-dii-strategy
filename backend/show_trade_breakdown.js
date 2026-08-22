const { generateHistoricalData } = require('./services/nseScraper');
const { runBacktest } = require('./services/backtestEngine');

function printTradeBreakdown() {
  const history = generateHistoricalData(25);
  const result = runBacktest(history, 100000, 1);
  const trades = result.trades;

  console.log('========================================================================================');
  console.log(' 📜 DAY-BY-DAY TRADE BREAKDOWN FOR 24 TRADING SESSIONS (1-LOT DEPLOYMENT)');
  console.log('========================================================================================\n');
  console.log(`| Day | Date       | Sentiment     | Strategy Used        | Gross PnL (₹) | Taxes & Fees (₹) | Net PnL (₹) | Cumulative (₹) |`);
  console.log(`|-----|------------|---------------|----------------------|---------------|------------------|-------------|----------------|`);

  let cumNet = 0;
  trades.forEach((t, i) => {
    cumNet += t.netPnl;
    const dayNum = String(i + 1).padStart(3);
    const dateStr = t.entryDate.padEnd(10);
    const sentStr = t.sentiment.padEnd(13);
    const stratStr = t.strategyUsed.substring(0, 20).padEnd(20);
    const grossStr = `₹${t.grossPnl}`.padStart(13);
    const taxStr = `₹${t.taxAndBrokerage}`.padStart(16);
    const netStr = `₹${t.netPnl}`.padStart(11);
    const cumStr = `₹${cumNet}`.padStart(14);

    console.log(`| ${dayNum} | ${dateStr} | ${sentStr} | ${stratStr} | ${grossStr} | ${taxStr} | ${netStr} | ${cumStr} |`);
  });

  console.log('========================================================================================\n');
}

printTradeBreakdown();
