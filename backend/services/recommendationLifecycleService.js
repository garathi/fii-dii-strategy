/**
 * Universal Recommendation Lifecycle Service
 * 
 * Rules:
 * 1. Standardizes Recommendation Date, Recommendation Price, Current Price, SL, and TP for all tabs.
 * 2. Tracks trade lifecycle: ACTIVE -> COMPLETED (TARGET_HIT / SL_HIT).
 * 3. Keeps completed recommendations visible on all pages for 2 FULL DAYS (48 Hours) post-exit.
 */

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../universal_recommendations.json');

let activeRecommendations = [
  // 1. Triple Confirmation Recommendation (BSE Short)
  {
    id: 'REC-TRIPLE-001',
    tabSource: 'Triple Confirmation',
    symbol: 'BSE.NS',
    name: 'BSE Ltd',
    signalType: 'SELL (SHORT)',
    recommendationDate: '2026-08-23 09:30:00',
    recommendationPrice: 3241.00,
    currentPrice: 3241.00,
    stopLossPrice: 3528.86,
    targetPrice: 2665.28,
    status: 'ACTIVE',
    exitDate: null,
    retainUntil: null,
    notes: 'Position Active. Monitoring target ₹2,665.28 vs SL ₹3,528.86.'
  },
  // 2. Triple Confirmation Recommendation (ITC Short)
  {
    id: 'REC-TRIPLE-002',
    tabSource: 'Triple Confirmation',
    symbol: 'ITC.NS',
    name: 'ITC Ltd',
    signalType: 'SELL (SHORT)',
    recommendationDate: '2026-08-23 09:30:00',
    recommendationPrice: 269.40,
    currentPrice: 269.40,
    stopLossPrice: 284.37,
    targetPrice: 239.46,
    status: 'ACTIVE',
    exitDate: null,
    retainUntil: null,
    notes: 'Position Active. Monitoring target ₹239.46 vs SL ₹284.37.'
  },
  // 3. Triple Confirmation Recommendation (DIXON Buy)
  {
    id: 'REC-TRIPLE-003',
    tabSource: 'Triple Confirmation',
    symbol: 'DIXON.NS',
    name: 'Dixon Tech',
    signalType: 'BUY',
    recommendationDate: '2026-08-23 09:30:00',
    recommendationPrice: 14850.00,
    currentPrice: 14850.00,
    stopLossPrice: 13957.70,
    targetPrice: 16634.60,
    status: 'ACTIVE',
    exitDate: null,
    retainUntil: null,
    notes: 'Position Active. Monitoring target ₹16,634.60 vs SL ₹13,957.70.'
  },
  // 4. Sample Completed Trade within 2-day retention window
  {
    id: 'REC-TRIPLE-004',
    tabSource: 'Triple Confirmation',
    symbol: 'POLYCAB.NS',
    name: 'Polycab India',
    signalType: 'BUY',
    recommendationDate: '2026-08-21 09:30:00',
    recommendationPrice: 8966.00,
    currentPrice: 10126.00,
    stopLossPrice: 8500.00,
    targetPrice: 10126.00,
    status: 'TARGET_HIT',
    exitDate: '2026-08-22 14:15:00',
    retainUntil: new Date(Date.now() + 2 * 86400 * 1000).toISOString(),
    notes: '✓ Target Hit (+12.9% Profit). Retained on dashboard for 2 days post-exit.'
  }
];

function getUniversalRecommendations() {
  const now = new Date();

  // Filter out recommendations whose 2-day retention window has expired
  activeRecommendations = activeRecommendations.filter(rec => {
    if (rec.status === 'ACTIVE') return true;
    if (rec.retainUntil && new Date(rec.retainUntil) > now) return true;
    return false; // Remove after 2 days post-exit
  });

  return activeRecommendations;
}

function updateRecommendationPrices(updates) {
  const now = new Date();
  activeRecommendations.forEach(rec => {
    if (rec.status === 'ACTIVE') {
      const liveQuote = updates[rec.symbol];
      if (liveQuote) {
        rec.currentPrice = liveQuote.price;

        if (rec.signalType === 'BUY') {
          if (rec.currentPrice >= rec.targetPrice) {
            rec.status = 'TARGET_HIT';
            rec.exitDate = now.toISOString();
            rec.retainUntil = new Date(now.getTime() + 2 * 86400 * 1000).toISOString();
            rec.notes = `✓ Target Hit at ₹${rec.currentPrice}! Retained on page for 2 days post-exit.`;
          } else if (rec.currentPrice <= rec.stopLossPrice) {
            rec.status = 'SL_HIT';
            rec.exitDate = now.toISOString();
            rec.retainUntil = new Date(now.getTime() + 2 * 86400 * 1000).toISOString();
            rec.notes = `🛑 Stop Loss Hit at ₹${rec.currentPrice}. Retained on page for 2 days post-exit.`;
          }
        } else if (rec.signalType.includes('SELL')) {
          if (rec.currentPrice <= rec.targetPrice) {
            rec.status = 'TARGET_HIT';
            rec.exitDate = now.toISOString();
            rec.retainUntil = new Date(now.getTime() + 2 * 86400 * 1000).toISOString();
            rec.notes = `✓ Target Hit at ₹${rec.currentPrice}! Retained on page for 2 days post-exit.`;
          } else if (rec.currentPrice >= rec.stopLossPrice) {
            rec.status = 'SL_HIT';
            rec.exitDate = now.toISOString();
            rec.retainUntil = new Date(now.getTime() + 2 * 86400 * 1000).toISOString();
            rec.notes = `🛑 Stop Loss Hit at ₹${rec.currentPrice}. Retained on page for 2 days post-exit.`;
          }
        }
      }
    }
  });
  return activeRecommendations;
}

module.exports = {
  getUniversalRecommendations,
  updateRecommendationPrices
};
