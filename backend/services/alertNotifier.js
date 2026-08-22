const axios = require('axios');

// In-memory trade log
const executedTrades = [];

async function triggerSignalAlert(signalData, settings = {}) {
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
  
  executedTrades.unshift(logEntry);
  if (executedTrades.length > 50) executedTrades.pop();

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

function getExecutedTrades() {
  return executedTrades;
}

module.exports = {
  triggerSignalAlert,
  getExecutedTrades
};
