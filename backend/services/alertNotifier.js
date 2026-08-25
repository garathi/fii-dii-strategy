const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Persistent trade log
const LOG_FILE = path.join(__dirname, '..', 'trade_logs.json');

function getExecutedTrades() {
  if (fs.existsSync(LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    } catch (e) {}
  }
  return [];
}

function saveExecutedTrades(trades) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(trades, null, 2));
}

async function triggerSignalAlert(signalData, settings = {}) {
  const trades = getExecutedTrades();
  
  const logEntry = {
    id: 'TRD-' + Date.now().toString().slice(-6),
    timestamp: new Date().toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    sentiment: signalData.sentiment,
    score: signalData.sentimentScore,
    strategyName: signalData.recommendedStrategy.name,
    combinedNet: signalData.combinedNet,
    status: 'EXECUTED_MOCK',
    legs: signalData.recommendedStrategy.legs
  };
  
  trades.unshift(logEntry);
  if (trades.length > 50) trades.pop();
  saveExecutedTrades(trades);

  const results = {
    mockExecution: true,
    tradeLog: logEntry,
    telegramSent: false,
    discordSent: false
  };

  // Telegram Notification
  if (settings.telegramWebhookUrl) {
    try {
      const msg = `🚨 *FII & DII SIGNAL TRIGGERED* 🚨\n\n` +
                  `*Sentiment:* ${signalData.sentiment} (Score: ${signalData.sentimentScore})\n` +
                  `*FII Net:* ₹${signalData.fiiNet} Cr | *DII Net:* ₹${signalData.diiNet} Cr\n` +
                  `*Strategy:* ${signalData.recommendedStrategy.name}\n` +
                  `*Action Advice:* ${signalData.recommendedStrategy.actionAdvice}`;
      await axios.post(settings.telegramWebhookUrl, { text: msg }, { timeout: 3000 });
      results.telegramSent = true;
    } catch (e) {
      results.telegramError = e.message;
    }
  }

  // Discord Notification
  if (settings.discordWebhookUrl) {
    try {
      const embed = {
        title: `FII/DII Strategy Alert: ${signalData.sentiment}`,
        description: signalData.recommendedStrategy.actionAdvice,
        color: signalData.sentiment.includes('BULLISH') ? 65280 : (signalData.sentiment.includes('BEARISH') ? 16711680 : 16753920),
        fields: [
          { name: 'FII Net Flow', value: `₹${signalData.fiiNet} Cr`, inline: true },
          { name: 'DII Net Flow', value: `₹${signalData.diiNet} Cr`, inline: true },
          { name: 'Strategy', value: signalData.recommendedStrategy.name, inline: false }
        ]
      };
      await axios.post(settings.discordWebhookUrl, { embeds: [embed] }, { timeout: 3000 });
      results.discordSent = true;
    } catch (e) {
      results.discordError = e.message;
    }
  }

  return results;
}

const STATE_FILE = path.join(__dirname, '..', 'alert_state.json');

function getAlertState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch (e) {
      return { lastFiiSentiment: null, rohanMehtaPicks: [], tripleConfirmationPicks: [] };
    }
  }
  return { lastFiiSentiment: null, rohanMehtaPicks: [], tripleConfirmationPicks: [] };
}

function saveAlertState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function evaluateHourlyAlerts(fiiData, rohanData, tripleData, settings) {
  const state = getAlertState();
  const currentRohanPicks = (rohanData?.strictQualifiers || []).map(s => s.symbol);
  const currentTriplePicks = (tripleData?.buySignals || []).map(s => s.symbol);
  
  const newRohanPicks = currentRohanPicks.filter(sym => !state.rohanMehtaPicks.includes(sym));
  const newTriplePicks = currentTriplePicks.filter(sym => !state.tripleConfirmationPicks.includes(sym));
  
  const sentimentChanged = fiiData?.sentiment !== state.lastFiiSentiment;

  // If nothing new, don't alert
  if (!sentimentChanged && newRohanPicks.length === 0 && newTriplePicks.length === 0) {
    console.log("⏰ [CRON]: No new strategies or stocks identified. Skipping Telegram alert to prevent spam.");
    return false;
  }

  let msg = `🚨 *HOURLY MARKET SCAN UPDATE* 🚨\n\n`;

  if (sentimentChanged) {
    msg += `📊 *FII/DII Shift:*\n`;
    msg += `New Sentiment: ${fiiData.sentiment} (Score: ${fiiData.sentimentScore})\n`;
    msg += `FII Net: ₹${fiiData.fiiNet} Cr | DII Net: ₹${fiiData.diiNet} Cr\n\n`;
  }

  if (newRohanPicks.length > 0) {
    msg += `🔥 *New Rohan Mehta ATH Additions:*\n`;
    msg += newRohanPicks.join(', ') + `\n\n`;
  }

  if (newTriplePicks.length > 0) {
    msg += `🎯 *New Triple Confirmation Additions:*\n`;
    msg += newTriplePicks.join(', ') + `\n\n`;
  }
  
  msg += `_View full details on your live dashboard._`;

  if (settings.telegramWebhookUrl) {
    try {
      await axios.post(settings.telegramWebhookUrl, { text: msg, parse_mode: "Markdown" }, { timeout: 3000 });
      console.log("⏰ [CRON]: Telegram alert sent successfully!");
      
      // Save new state
      state.lastFiiSentiment = fiiData?.sentiment;
      state.rohanMehtaPicks = [...new Set([...state.rohanMehtaPicks, ...newRohanPicks])];
      state.tripleConfirmationPicks = [...new Set([...state.tripleConfirmationPicks, ...newTriplePicks])];
      saveAlertState(state);
      
      return true;
    } catch (e) {
      console.error("⏰ [CRON]: Telegram webhook failed:", e.message);
    }
  }
  return false;
}

module.exports = {
  triggerSignalAlert,
  getExecutedTrades,
  evaluateHourlyAlerts
};
