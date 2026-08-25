import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, Clock, RefreshCw, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import Loader from './Loader';

export default function InstitutionalRatioStrategy() {
  const [positionData, setPositionData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStrategyData = () => {
    setLoading(true);
    fetch('/api/position/active')
      .then(res => res.json())
      .then(data => {
        if (data.success) setPositionData(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStrategyData();
    const interval = setInterval(fetchStrategyData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Loader message="Loading 1:2 Institutional Ratio Spread Strategy Specs & Rates..." />;
  }

  const pos = positionData?.positions?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Date & Deployment Specification Header */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(37,99,235,0.12))', border: '1px solid rgba(56,189,248,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <ShieldCheck size={18} /> Institutional Hedged Alpha Model
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
              1:2 Institutional Ratio Spread + VIX Circuit Strategy
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Designed for 10% Crash Protection & 10% Upside Rally Gains while earning theta credit.
            </p>
          </div>

          <button className="btn-secondary" onClick={fetchStrategyData} style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', background: 'var(--accent-cyan)', color: '#000', fontWeight: 700 }}>
            <RefreshCw size={14} /> Refresh Live Rates
          </button>
        </div>

        {/* Date Specifications Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginTop: '1.25rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={13} /> Signal Generation Date
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
              {pos?.signalDate || 'N/A'}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
              <Clock size={13} /> Recommended Deployment
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
              {pos?.deploymentDate || 'N/A'}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={13} /> Contract Expiry Date
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.2rem' }}>
              {pos?.expiryDate || 'N/A'}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
              Required Margin ({pos?.lots || 2} Lots)
            </div>
            <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
              ₹{pos?.marginRequired?.toLocaleString('en-IN') || '90,000'} ({pos?.totalQty || 130} Qty)
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Price vs Current Live Price Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={18} style={{ color: '#38bdf8' }} /> Option Legs: Recommended Price vs Current Live Rate
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Transaction & Leg</th>
                <th style={{ padding: '0.75rem 1rem' }}>Strike & Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Quantity / Lots</th>
                <th style={{ padding: '0.75rem 1rem' }}>Recommended Entry Price</th>
                <th style={{ padding: '0.75rem 1rem' }}>Current Live Rate (LTP)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Price Variance (Δ)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Leg Status</th>
              </tr>
            </thead>
            <tbody>
              {pos?.legs?.map((leg, idx) => {
                const action = leg.type && leg.type.startsWith('SELL') ? 'SELL' : 'BUY';
                const lots = Math.abs(leg.qty) / (pos?.lotSize || 65);
                const diff = leg.currentLtp - leg.entryLtp;
                const isProfitableLeg = action === 'SELL' ? diff <= 0 : diff >= 0;

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${action === 'BUY' ? 'badge-bullish' : 'badge-bearish'}`}>
                        {action} {lots}x
                      </span>
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fff' }}>
                      NIFTY {leg.strike} {leg.optionType}
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {lots} Lots ({Math.abs(leg.qty)} Qty)
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fbbf24' }}>
                      ₹{leg.entryLtp?.toFixed(2)}
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#38bdf8' }}>
                      ₹{leg.currentLtp?.toFixed(2)}
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: isProfitableLeg ? '#34d399' : '#f87171' }}>
                      {diff >= 0 ? `+₹${diff.toFixed(2)}` : `-₹${Math.abs(diff).toFixed(2)}`}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${isProfitableLeg ? 'badge-bullish' : 'badge-bearish'}`}>
                        {isProfitableLeg ? 'IN PROFIT' : 'DECAYING'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* M2M & Square Off Status Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
            Live M2M Position Tracker & Square-Off Monitor
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Auto-tracks running P&L and VIX Circuit Breaker until target square-off.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Net Credit Collected</div>
              <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
                ₹{pos?.totalCreditCollected?.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target Profit (50%)</div>
              <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                +₹{pos?.targetPnl?.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Running M2M P&L</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: pos?.currentM2mPnl >= 0 ? '#34d399' : '#f87171', marginTop: '0.2rem' }}>
                {pos?.currentM2mPnl >= 0 ? `+₹${pos?.currentM2mPnl?.toLocaleString('en-IN')}` : `-₹${Math.abs(pos?.currentM2mPnl)?.toLocaleString('en-IN')}`}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
            Square-Off Monitor Note
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {pos?.squareOffNotes}
          </p>
        </div>
      </div>
    </div>
  );
}
