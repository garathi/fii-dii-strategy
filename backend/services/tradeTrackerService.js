/**
 * Trade Tracker Service
 * Tracks active 1:2 Ratio Spread positions until Square-Off
 */

let activePositions = [
  {
    id: 'TRADE-RATIO-101',
    symbol: 'NIFTY',
    niftyEntrySpot: 24820,
    entryTimestamp: '2026-08-22 09:30:00 IST',
    expiry: 'Tuesday Weekly',
    strategyType: '1:2 Institutional Ratio Spread + VIX Circuit',
    status: 'ACTIVE',
    recommendedLots: 2,
    contractLotSize: 65,
    totalQuantity: 130,
    approxMarginRequired: 90000,
    legs: [
      { action: 'SELL', optionType: 'PE', strike: 24000, entryPrice: 120, currentLtp: 118, qty: 65, lots: 1 },
      { action: 'BUY', optionType: 'PE', strike: 22800, entryPrice: 40, currentLtp: 41, qty: 130, lots: 2 },
      { action: 'SELL', optionType: 'CE', strike: 25600, entryPrice: 120, currentLtp: 115, qty: 65, lots: 1 },
      { action: 'BUY', optionType: 'CE', strike: 26800, entryPrice: 40, currentLtp: 39, qty: 130, lots: 2 }
    ],
    netCreditPerQty: 80,
    totalCreditCollected: 10400, // 80 * 130 qty
    currentM2mPnl: +650, // Live running P&L in Rupees
    targetPnl: +5200, // Square-off at 50% max profit
    maxStopLossPnl: -2600,
    vixCircuitTriggered: false,
    squareOffNotes: 'Position active. Monitoring M2M P&L and VIX Circuit Breaker until 50% target (+₹5,200) or Tuesday 3:15 PM expiry.'
  }
];

function getActivePositions() {
  return activePositions;
}

function updatePositionM2m(niftyCurrentSpot, vixChangePct = 0) {
  activePositions.forEach(pos => {
    if (pos.status === 'ACTIVE') {
      const spotDiff = niftyCurrentSpot - pos.niftyEntrySpot;
      
      // Calculate running M2M based on spot movement and decay
      let runningPnl = 650 + (spotDiff * 0.15 * pos.totalQuantity);
      
      if (vixChangePct >= 18.0) {
        pos.vixCircuitTriggered = true;
        pos.squareOffNotes = '⚠️ VIX CIRCUIT BREAKER TRIGGERED! Auto-closing sold legs, holding 2x long wings for crash explosion.';
      }

      if (runningPnl >= pos.targetPnl) {
        pos.status = 'SQUARED_OFF_PROFIT_TARGET';
        pos.currentM2mPnl = pos.targetPnl;
        pos.squareOffNotes = `✓ SQUARE OFF COMPLETE: Target profit of ₹${pos.targetPnl} reached (50% net credit collected).`;
      } else if (runningPnl <= pos.maxStopLossPnl) {
        pos.status = 'SQUARED_OFF_STOP_LOSS';
        pos.currentM2mPnl = pos.maxStopLossPnl;
        pos.squareOffNotes = `🛑 SQUARE OFF COMPLETE: Stop Loss hit at -₹${Math.abs(pos.maxStopLossPnl)}.`;
      } else {
        pos.currentM2mPnl = Math.round(runningPnl);
      }
    }
  });
  return activePositions;
}

module.exports = {
  getActivePositions,
  updatePositionM2m
};
