const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const cron = require('node-cron');

const { getFiiDiiToday, generateHistoricalData } = require('./services/nseScraper');
const { analyzeFiiDiiSentiment } = require('./services/strategyEngine');
const { triggerSignalAlert, getExecutedTrades } = require('./services/alertNotifier');
const { runRealBacktest, getRealNiftyHistory } = require('./services/backtestEngine');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve React Frontend static assets in production
const frontendDist = path.join(__dirname, '../frontend/dist');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

let userSettings = {
  minFiiThreshold: 500,
  minDiiThreshold: 300,
  riskPerTradePct: 2,
  telegramWebhookUrl: '',
  discordWebhookUrl: '',
  autoTradingEnabled: false
};

// 1. Get today's FII/DII sentiment & recommended strategy
app.get('/api/fii-dii/today', async (req, res) => {
  try {
    const data = await getFiiDiiToday();
    const sentimentAnalysis = analyzeFiiDiiSentiment(data.today);
    
    res.json({
      success: true,
      raw: data.today,
      analysis: sentimentAnalysis,
      isLive: data.today.isLive || false,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get historical FII & DII trends (30 days)
app.get('/api/fii-dii/history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const history = generateHistoricalData(days);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Trigger Signal & Execute Order (Mock or Webhook)
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

// 4. Get Executed Trade Logs
app.get('/api/trade-log', (req, res) => {
  res.json({ success: true, trades: getExecutedTrades() });
});

// 5. Run Strategy Backtest Simulator (Real Yahoo Finance Data)
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

// 6. Settings REST API
app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: userSettings });
});

app.post('/api/settings', (req, res) => {
  userSettings = { ...userSettings, ...req.body };
  res.json({ success: true, settings: userSettings, message: 'Settings updated successfully' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Fallback to React index.html for SPA routes
app.get('*', (req, res) => {
  if (require('fs').existsSync(path.join(frontendDist, 'index.html'))) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  } else {
    res.send('FII/DII Backend Server Running.');
  }
});

const server = http.createServer(app);

// WebSocket Server for live dashboard updates
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
  const interval = setInterval(async () => {
    try {
      const data = await getFiiDiiToday();
      const analysis = analyzeFiiDiiSentiment(data.today);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'TICKER_UPDATE', data: analysis }));
      }
    } catch (e) {}
  }, 10000);
  
  ws.on('close', () => clearInterval(interval));
});

// =========================================================================
// AUTOMATED DAILY SCHEDULER (Wakes up at 5:30 PM & 6:30 PM IST on Trading Days)
// =========================================================================
// Cron format: '30 17 * * 1-5' = 5:30 PM IST Monday-Friday
cron.schedule('30 17 * * 1-5', async () => {
  console.log('⏰ [CRON JOB RUNNING]: Fetching newly released NSE FII/DII Cash Data at 5:30 PM IST...');
  try {
    const data = await getFiiDiiToday();
    const analysis = analyzeFiiDiiSentiment(data.today);
    console.log(`✓ Daily Fetch Successful | Date: ${data.today.date} | FII: ${data.today.fii.netValue} Cr | DII: ${data.today.dii.netValue} Cr`);
    
    if (userSettings.autoTradingEnabled) {
      await triggerSignalAlert(analysis, userSettings);
    }
  } catch (e) {
    console.error('Cron job error:', e.message);
  }
});

// Cron format: '30 18 * * 1-5' = 6:30 PM IST Monday-Friday (Participant OI Release)
cron.schedule('30 18 * * 1-5', async () => {
  console.log('⏰ [CRON JOB RUNNING]: Fetching newly released NSE Participant OI Data at 6:30 PM IST...');
  try {
    const data = await getFiiDiiToday();
    console.log('✓ Participant OI Data Updated Successfully.');
  } catch (e) {}
});

server.listen(PORT, () => {
  console.log(`🚀 FII/DII Automated Server running on port ${PORT}`);
});
