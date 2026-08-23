const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const cron = require('node-cron');
const { execSync, execFileSync } = require('child_process');
const fs = require('fs');

// Detect correct Python binary
let PYTHON_BIN = 'python3';
const venvLinux = path.join(__dirname, '..', 'venv', 'bin', 'python');
const venvWin = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');

if (fs.existsSync(venvLinux)) {
  PYTHON_BIN = venvLinux;
} else if (fs.existsSync(venvWin)) {
  PYTHON_BIN = venvWin;
} else {
  try { execFileSync('python3', ['--version']); } catch (e) {
    try { execFileSync('python', ['--version']); PYTHON_BIN = 'python'; } catch (e2) {
      console.warn('⚠️  No Python binary found — live screener will serve cached JSON');
      PYTHON_BIN = null;
    }
  }
}
console.log(`🐍 Python binary: ${PYTHON_BIN || 'NONE (using cached JSON)'}`);

const { getFiiDiiToday, generateHistoricalData } = require('./services/nseScraper');
const { analyzeFiiDiiSentiment } = require('./services/strategyEngine');
const { triggerSignalAlert, getExecutedTrades } = require('./services/alertNotifier');
const { runRealBacktest, getRealNiftyHistory } = require('./services/backtestEngine');
const { screenRohanMehtaAthStrategy } = require('./services/rohanMehtaAthEngine');
const { getActivePositions, updatePositionM2m } = require('./services/tradeTrackerService');
const { getTripleConfirmationSignals } = require('./services/tripleConfirmationEngine');
const { getUniversalRecommendations } = require('./services/recommendationLifecycleService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve built frontend — path is relative to backend/__dirname on both local + Render
const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
console.log(`📁 Serving frontend from: ${frontendDist}`);
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { index: 'index.html' }));
  console.log('✓ Frontend static files mounted');
} else {
  console.warn('⚠️  frontend/dist not found — HTML will not be served');
}

let userSettings = {
  minFiiThreshold: 500, minDiiThreshold: 300, riskPerTradePct: 2,
  telegramWebhookUrl: '', discordWebhookUrl: '', autoTradingEnabled: false
};

const realScreenerPath = path.join(__dirname, 'real_nifty500_screener.json');
const realQuotesPath = path.join(__dirname, 'real_live_market_quotes.json');

const { exec } = require('child_process');

function runPythonScript(scriptName) {
  if (!PYTHON_BIN) return false;
  const scriptPath = path.join(__dirname, scriptName);
  if (!fs.existsSync(scriptPath)) { console.warn(`Script not found: ${scriptName}`); return false; }
  
  exec(`${PYTHON_BIN} "${scriptPath}"`, { encoding: 'utf-8', timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`⚠️  Error running ${scriptName}: ${error.message.substring(0, 200)}`);
      return;
    }
    console.log(`✓ [Python] ${scriptName} done`);
  });
  return true;
}

// 1. FII/DII Today
app.get('/api/fii-dii/today', async (req, res) => {
  try {
    const data = await getFiiDiiToday();
    const sentimentAnalysis = analyzeFiiDiiSentiment(data.today);
    res.json({ success: true, raw: data.today, analysis: sentimentAnalysis, isLive: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Master Refresh All Rates
app.post('/api/refresh-all-rates', async (req, res) => {
  try {
    console.log('🔄 [MASTER REFRESH]: Running live price scans...');
    runPythonScript('fetch_real_live_quotes.py');
    runPythonScript('live_nifty500_screener.py');
    runPythonScript('scan_inr_currency_triple.py');
    res.json({ success: true, message: 'Live market rates refreshed across all strategy tabs!', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Nifty 500 Screener - serves pre-built JSON (Python runs on startup/refresh, NOT on every request)
app.get('/api/fii-dii/stocks', (req, res) => {
  try {
    let stocks = [];
    if (fs.existsSync(realScreenerPath)) {
      const raw = fs.readFileSync(realScreenerPath, 'utf-8');
      stocks = JSON.parse(raw).stocks || [];
    } else {
      console.warn('real_nifty500_screener.json not found — returning empty list');
    }
    res.json({
      success: true,
      allStocks: stocks,
      topBuyPicks: stocks.filter(s => s.signal && s.signal.includes('BUY')),
      topShortPicks: stocks.filter(s => s.signal && s.signal.includes('SELL')),
      summary: {
        totalScreened: stocks.length,
        institutionalBuyCount: stocks.filter(s => s.signal && s.signal.includes('BUY')).length,
        institutionalShortCount: stocks.filter(s => s.signal && s.signal.includes('SELL')).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Triple Confirmation Strategy
app.get('/api/strategy/triple-confirmation', (req, res) => {
  try {
    const result = getTripleConfirmationSignals();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Rohan Mehta ATH Strategy
app.get('/api/strategy/rohan-mehta-ath', (req, res) => {
  try {
    const result = screenRohanMehtaAthStrategy();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Active Trade Position Tracker
app.get('/api/position/active', async (req, res) => {
  try {
    const data = await getFiiDiiToday();
    const currentSpot = data.today.niftyClose || 24252;
    const trackedPositions = updatePositionM2m(currentSpot, 0);
    res.json({ success: true, niftyCurrentSpot: currentSpot, positions: trackedPositions, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Universal Recommendation Lifecycle
app.get('/api/recommendations/lifecycle', (req, res) => {
  try {
    const recommendations = getUniversalRecommendations();
    res.json({ success: true, recommendations, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. FII/DII History
app.get('/api/fii-dii/history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const history = generateHistoricalData(days);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Trigger Signal
app.post('/api/trigger-signal', async (req, res) => {
  try {
    const data = await getFiiDiiToday();
    const sentimentAnalysis = analyzeFiiDiiSentiment(data.today);
    const result = await triggerSignalAlert(sentimentAnalysis, userSettings);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Trade Log
app.get('/api/trade-log', (req, res) => {
  res.json({ success: true, trades: getExecutedTrades() });
});

// 11. Backtest
app.post('/api/backtest', (req, res) => {
  try {
    const { initialCapital, days, lots } = req.body;
    const capital = parseFloat(initialCapital) || 400000;
    const numLots = parseInt(lots) || 2;
    const realHistory = getRealNiftyHistory();
    const result = runRealBacktest(realHistory, capital, numLots, 65);
    res.json({ success: true, backtest: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Settings
app.get('/api/settings', (req, res) => res.json({ success: true, settings: userSettings }));
app.post('/api/settings', (req, res) => {
  userSettings = { ...userSettings, ...req.body };
  res.json({ success: true, settings: userSettings });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('*', (req, res) => {
  if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  } else {
    res.send('FII/DII Backend Server Running.');
  }
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
  const interval = setInterval(async () => {
    try {
      const data = await getFiiDiiToday();
      const analysis = analyzeFiiDiiSentiment(data.today);
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'TICKER_UPDATE', data: analysis }));
    } catch (e) {}
  }, 10000);
  ws.on('close', () => clearInterval(interval));
});

async function runStartupAutoFetch() {
  console.log('\n🚀 [STARTUP]: Fetching 100% real live market quotes...');
  runPythonScript('fetch_real_live_quotes.py');
  runPythonScript('live_nifty500_screener.py');
  runPythonScript('scan_inr_currency_triple.py');
  try {
    const data = await getFiiDiiToday();
    console.log(`✓ Nifty 50 Spot: ₹${data.today.niftyClose}`);
  } catch (err) {
    console.error('Startup error:', err.message);
  }
}

cron.schedule('30 17 * * 1-5', async () => {
  console.log('⏰ [CRON]: Refreshing live market data at 5:30 PM...');
  runPythonScript('fetch_real_live_quotes.py');
  runPythonScript('live_nifty500_screener.py');
  
  try {
    const data = await getFiiDiiToday();
    const sentimentAnalysis = analyzeFiiDiiSentiment(data.today);
    console.log(`⏰ [CRON]: Analyzing market sentiment: ${sentimentAnalysis.sentiment}. Triggering automated alerts if configured...`);
    await triggerSignalAlert(sentimentAnalysis, userSettings);
  } catch (err) {
    console.error('Cron alert error:', err.message);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 FII/DII Automated Server running on port ${PORT}`);
  runStartupAutoFetch();
});
