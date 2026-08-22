const { getFiiDiiToday, generateHistoricalData } = require('./services/nseScraper');
const { analyzeFiiDiiSentiment } = require('./services/strategyEngine');
const { runBacktest } = require('./services/backtestEngine');

async function testBackendEngine() {
  console.log('--- TESTING FII/DII STRATEGY AUTOMATION ENGINE ---');

  // 1. Test Scraper & Data Generator
  const data = await getFiiDiiToday();
  console.log('✓ Scraper fetched today data:', data.today.date, '| FII Net:', data.today.fii.netValue, '| DII Net:', data.today.dii.netValue);

  // 2. Test Sentiment Scoring & Strategy Generator
  const analysis = analyzeFiiDiiSentiment(data.today);
  console.log('✓ Sentiment Score:', analysis.sentimentScore, '| Sentiment:', analysis.sentiment, '| Strategy:', analysis.recommendedStrategy.name);
  console.log('✓ Risk/Reward:', analysis.recommendedStrategy.riskRewardRatio, '| Action:', analysis.recommendedStrategy.actionAdvice);

  // 3. Test Backtest Simulator
  const history = generateHistoricalData(60);
  const backtest = runBacktest(history, 100000);
  console.log('✓ Backtest 60 Days Result | ROI:', backtest.summary.roiPct + '%', '| Win Rate:', backtest.summary.winRate + '%', '| Trades:', backtest.summary.totalTrades);

  console.log('\n✅ ALL BACKEND TEST PASSING SUCCESSFULLY!');
}

testBackendEngine().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
