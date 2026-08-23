/**
 * 20 DMA + 100 DMA + RSI Triple Confirmation Strategy Engine
 * Scans F&O Indices, Nifty 50 Stocks, and All Major INR Currency Pairs
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const stockJsonPath = path.join(__dirname, '../triple_confirmation_signals.json');
const currencyJsonPath = path.join(__dirname, '../inr_currency_signals.json');

const pythonStockScript = path.join(__dirname, '../scan_triple_dma_nifty50.py');
const pythonCurrencyScript = path.join(__dirname, '../scan_inr_currency_triple.py');

function getTripleConfirmationSignals() {
  // Trigger Python scanners for fresh quotes
  try {
    execSync(`python "${pythonCurrencyScript}"`, { encoding: 'utf-8', timeout: 30000 });
  } catch (err) {}

  let stockSignals = [];
  let currencySignals = [];

  if (fs.existsSync(stockJsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(stockJsonPath, 'utf-8'));
      stockSignals = parsed.signals || [];
    } catch (e) {}
  }

  if (fs.existsSync(currencyJsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(currencyJsonPath, 'utf-8'));
      currencySignals = parsed.signals || [];
    } catch (e) {}
  }

  const allSignals = [...stockSignals, ...currencySignals];

  return {
    signals: allSignals,
    stockCount: stockSignals.length,
    currencyCount: currencySignals.length,
    scannedAt: new Date().toISOString()
  };
}

module.exports = {
  getTripleConfirmationSignals
};
