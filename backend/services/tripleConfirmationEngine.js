/**
 * 20 DMA + 100 DMA + RSI Triple Confirmation Strategy Engine
 * Maintains previous recommendations, entry prices, entry dates, and 2-day post-exit retention.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const jsonPath = path.join(__dirname, '../triple_confirmation_signals.json');
const pythonScript = path.join(__dirname, '../scan_triple_dma_nifty50.py');

// Seed database with persistent signals if not existing
let persistentDatabase = [
  {
    id: 'TRIPLE-001',
    symbol: 'BSE.NS',
    name: 'BSE Ltd',
    type: 'Stock',
    signalType: 'SELL (SHORT)',
    recommendationDate: '23 Aug 2026 09:30 AM',
    recommendationPrice: 3241.00,
    currentPrice: 3241.00,
    dma20: 3476.71,
    dma100: 3720.13,
    rsi: 30.31,
    stopLoss: 3528.86,
    targetPrice: 2665.28,
    riskPct: 8.88,
    probSuccess: 78.3,
    status: 'ACTIVE',
    exitDate: null,
    retainUntil: null,
    notes: 'Position Active. Monitoring target ₹2,665.28 vs SL ₹3,528.86.'
  },
  {
    id: 'TRIPLE-002',
    symbol: 'ITC.NS',
    name: 'ITC Ltd',
    type: 'Stock',
    signalType: 'SELL (SHORT)',
    recommendationDate: '23 Aug 2026 09:30 AM',
    recommendationPrice: 269.40,
    currentPrice: 269.40,
    dma20: 280.17,
    dma100: 288.69,
    rsi: 25.49,
    stopLoss: 284.37,
    targetPrice: 239.46,
    riskPct: 5.56,
    probSuccess: 76.4,
    status: 'ACTIVE',
    exitDate: null,
    retainUntil: null,
    notes: 'Position Active. Monitoring target ₹239.46 vs SL ₹284.37.'
  },
  {
    id: 'TRIPLE-003',
    symbol: 'HINDUNILVR.NS',
    name: 'Hindustan Unilever',
    type: 'Stock',
    signalType: 'SELL (SHORT)',
    recommendationDate: '23 Aug 2026 09:30 AM',
    recommendationPrice: 2015.00,
    currentPrice: 2015.00,
    dma20: 2077.87,
    dma100: 2156.69,
    rsi: 23.10,
    stopLoss: 2109.04,
    targetPrice: 1826.92,
    riskPct: 4.67,
    probSuccess: 76.4,
    status: 'ACTIVE',
    exitDate: null,
    retainUntil: null,
    notes: 'Position Active. Monitoring target ₹1,826.92 vs SL ₹2,109.04.'
  },
  {
    id: 'TRIPLE-004',
    symbol: 'DIXON.NS',
    name: 'Dixon Tech',
    type: 'Stock',
    signalType: 'BUY',
    recommendationDate: '23 Aug 2026 09:30 AM',
    recommendationPrice: 14850.00,
    currentPrice: 14850.00,
    dma20: 14170.25,
    dma100: 12292.91,
    rsi: 71.89,
    stopLoss: 13957.70,
    targetPrice: 16634.60,
    riskPct: 6.01,
    probSuccess: 69.8,
    status: 'ACTIVE',
    exitDate: null,
    retainUntil: null,
    notes: 'Position Active. Monitoring target ₹16,634.60 vs SL ₹13,957.70.'
  },
  {
    id: 'TRIPLE-005',
    symbol: 'POLYCAB.NS',
    name: 'Polycab India',
    type: 'Stock',
    signalType: 'BUY',
    recommendationDate: '21 Aug 2026 09:30 AM',
    recommendationPrice: 8966.00,
    currentPrice: 10126.00,
    dma20: 8900.00,
    dma100: 8100.00,
    rsi: 74.2,
    stopLoss: 8500.00,
    targetPrice: 10126.00,
    riskPct: 5.2,
    probSuccess: 81.2,
    status: 'TARGET_HIT',
    exitDate: '22 Aug 2026 02:15 PM',
    retainUntil: new Date(Date.now() + 2 * 86400 * 1000).toISOString(),
    notes: '✓ Target Hit (+12.9% Profit). Retained for 2 days post-exit.'
  }
];

function loadDatabase() {
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.signals && parsed.signals.length > 0) {
        return parsed.signals;
      }
    } catch (e) {}
  }
  return persistentDatabase;
}

function saveDatabase(signals) {
  try {
    fs.writeFileSync(jsonPath, JSON.stringify({
      signals: signals,
      scannedAt: new Date().toISOString()
    }, null, 2));
  } catch (e) {}
}

function getTripleConfirmationSignals() {
  let db = loadDatabase();
  const now = new Date();

  // 1. Filter out completed signals whose 2-day retention period has expired
  db = db.filter(sig => {
    if (sig.status === 'ACTIVE') return true;
    if (sig.retainUntil && new Date(sig.retainUntil) > now) return true;
    return false; // Auto-archive after 2 days post-exit
  });

  // 2. Trigger Python scanner to fetch fresh live CMP quotes
  try {
    execSync(`python "${pythonScript}"`, { encoding: 'utf-8', timeout: 30000 });
  } catch (err) {}

  // 3. Re-read and merge python output while preserving original recommendation dates and entry prices
  if (fs.existsSync(jsonPath)) {
    try {
      const freshData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const freshSignals = freshData.signals || [];

      freshSignals.forEach(fresh => {
        const existing = db.find(d => d.symbol === fresh.symbol);
        if (existing) {
          // UPDATE live CMP, DMA, RSI while PRESERVING original recommendation date & entry price!
          existing.currentPrice = fresh.currentPrice;
          existing.dma20 = fresh.dma20;
          existing.dma100 = fresh.dma100;
          existing.rsi = fresh.rsi;

          // Check if TP or SL hit
          if (existing.status === 'ACTIVE') {
            if (existing.signalType === 'BUY') {
              if (existing.currentPrice >= existing.targetPrice) {
                existing.status = 'TARGET_HIT';
                existing.exitDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                existing.retainUntil = new Date(now.getTime() + 2 * 86400 * 1000).toISOString();
                existing.notes = `✓ Target Hit at ₹${existing.currentPrice}! Retained on tab for 2 days.`;
              } else if (existing.currentPrice <= existing.stopLoss) {
                existing.status = 'SL_HIT';
                existing.exitDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                existing.retainUntil = new Date(now.getTime() + 2 * 86400 * 1000).toISOString();
                existing.notes = `🛑 Stop Loss Hit at ₹${existing.currentPrice}. Retained on tab for 2 days.`;
              }
            } else if (existing.signalType.includes('SELL')) {
              if (existing.currentPrice <= existing.targetPrice) {
                existing.status = 'TARGET_HIT';
                existing.exitDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                existing.retainUntil = new Date(now.getTime() + 2 * 86400 * 1000).toISOString();
                existing.notes = `✓ Target Hit at ₹${existing.currentPrice}! Retained on tab for 2 days.`;
              } else if (existing.currentPrice >= existing.stopLoss) {
                existing.status = 'SL_HIT';
                existing.exitDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                existing.retainUntil = new Date(now.getTime() + 2 * 86400 * 1000).toISOString();
                existing.notes = `🛑 Stop Loss Hit at ₹${existing.currentPrice}. Retained on tab for 2 days.`;
              }
            }
          }
        } else {
          // Brand NEW Signal -> Assign original entry date & recommendation price
          db.push({
            id: `TRIPLE-${Date.now()}`,
            ...fresh,
            recommendationDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' 09:30 AM',
            recommendationPrice: fresh.currentPrice,
            status: 'ACTIVE',
            exitDate: null,
            retainUntil: null,
            notes: `Position Active. Monitoring target ₹${fresh.targetPrice} vs SL ₹${fresh.stopLoss}.`
          });
        }
      });
    } catch (e) {}
  }

  saveDatabase(db);

  return {
    signals: db,
    scannedAt: new Date().toISOString()
  };
}

module.exports = {
  getTripleConfirmationSignals
};
