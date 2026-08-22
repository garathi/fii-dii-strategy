import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, CheckCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function ActivePositionTracker() {
  const [positionData, setPositionData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPosition = () => {
    fetch('/api/position/active')
      .then(res => res.json())
      .then(data => {
        if (data.success) setPositionData(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosition();
    const timer = setInterval(fetchPosition, 10000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading Active Position Tracker...
      </div>
    );
  }

  const pos = positionData?.positions?.[0];
  if (!pos) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem', border: '1px solid rgba(56,189,248,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Live Active Position Tracker
            </span>
            <span className="live-pulse"></span>
            <span className="badge badge-bullish" style={{ fontSize: '0.7rem' }}>
              STATUS: {pos.status}
            </span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
            {pos.strategyType} ({pos.recommendedLots} Lots / {pos.totalQuantity} Qty)
          </h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live Running M2M P&L</div>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: pos.currentM2mPnl >= 0 ? '#34d399' : '#f87171' }}>
            {pos.currentM2mPnl >= 0 ? `+₹${pos.currentM2mPnl.toLocaleString('en-IN')}` : `-₹${Math.abs(pos.currentM2mPnl).toLocaleString('en-IN')}`}
          </div>
        </div>
      </div>

      {/* Position Leg Details Table */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Position Order Legs
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
            Entry Price vs Live LTP
          </span>
        </div>

        {pos.legs.map((leg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: idx < pos.legs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`badge ${leg.action === 'BUY' ? 'badge-bullish' : 'badge-bearish'}`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                {leg.action} {leg.lots}x
              </span>
              <span className="mono" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                NIFTY {leg.strike} {leg.optionType}
              </span>
            </div>
            <div style={{ textAlign: 'right' }} className="mono">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Entry: ₹{leg.entryPrice}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginLeft: '0.85rem' }}>LTP: ₹{leg.currentLtp}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Target & Square-Off Parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Credit Collected</div>
          <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
            ₹{pos.totalCreditCollected.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Square-Off Profit Target</div>
          <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
            +₹{pos.targetPnl.toLocaleString('en-IN')} (50% Max)
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VIX Circuit Status</div>
          <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: pos.vixCircuitTriggered ? '#f87171' : '#34d399', marginTop: '0.2rem' }}>
            {pos.vixCircuitTriggered ? '⚠️ TRIGGERED' : '✓ NORMAL (<18%)'}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Square-Off Rule</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            50% Target or Tuesday 3:15 PM
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <strong>Square-Off Monitor Note:</strong> {pos.squareOffNotes}
      </div>
    </div>
  );
}
