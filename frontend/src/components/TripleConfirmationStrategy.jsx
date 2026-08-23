import React, { useState, useEffect } from 'react';
import { Target, ShieldAlert, TrendingUp, TrendingDown, RefreshCw, Filter, Clock, CheckCircle } from 'lucide-react';

export default function TripleConfirmationStrategy() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlyHighProb, setOnlyHighProb] = useState(true);

  const fetchTripleData = () => {
    setLoading(true);
    fetch('/api/strategy/triple-confirmation')
      .then(res => res.json())
      .then(resData => {
        if (resData.success) setData(resData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTripleData();
    const interval = setInterval(fetchTripleData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Scanning F&O Indices & Nifty 50 for 20 DMA + 100 DMA + RSI Triple Confirmation Calls...
      </div>
    );
  }

  const allSignals = data?.signals || [];
  const filteredSignals = onlyHighProb
    ? allSignals.filter(s => s.probSuccess >= 70.0)
    : allSignals;

  const buyCallsCount = filteredSignals.filter(s => s.signalType === 'BUY').length;
  const sellCallsCount = filteredSignals.filter(s => s.signalType.includes('SELL')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(37,99,235,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Clock size={18} /> Recommendation Lifecycle & 2-Day Retention Tracker
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
              20 DMA + 100 DMA + RSI Triple Confirmation Strategy
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Tracks Recommendation Date, Entry Price, Live LTP, SL, and TP. Retains calls for 2 days after hitting Target or Stop Loss.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setOnlyHighProb(!onlyHighProb)}
              className={`btn-secondary ${onlyHighProb ? 'btn-primary' : ''}`}
              style={{ background: onlyHighProb ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : '', fontSize: '0.8rem' }}
            >
              <Filter size={14} /> {onlyHighProb ? 'Showing High Prob (≥70%)' : 'Show All Calls'}
            </button>
            <button className="btn-secondary" onClick={fetchTripleData} style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', background: 'var(--accent-cyan)', color: '#000', fontWeight: 700 }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Rescan Now
            </button>
          </div>
        </div>

        {/* Retention Rule Info Banner */}
        <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} />
          <span><strong>2-Day Post-Exit Retention Policy:</strong> When a stock hits its Target Price (TP) or Stop Loss (SL), it remains displayed on this tab for 2 full calendar days before auto-archiving.</span>
        </div>
      </div>

      {/* Signal Cards Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} style={{ color: '#8b5cf6' }} /> Active & Retained Triple Confirmation Calls
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Scanned: {data?.scannedAt ? new Date(data.scannedAt).toLocaleTimeString() : 'Just Now'}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Recommendation Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Instrument & Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Signal Call</th>
                <th style={{ padding: '0.75rem 1rem' }}>Rec. Entry Price</th>
                <th style={{ padding: '0.75rem 1rem' }}>Current Live Rate</th>
                <th style={{ padding: '0.75rem 1rem' }}>Exact Stop Loss</th>
                <th style={{ padding: '0.75rem 1rem' }}>1:2 Target Price</th>
                <th style={{ padding: '0.75rem 1rem' }}>Success Prob</th>
                <th style={{ padding: '0.75rem 1rem' }}>Retention Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignals.map((sig, idx) => {
                const isBuy = sig.signalType === 'BUY';
                const isHighProb = sig.probSuccess >= 70.0;
                const recDate = sig.recommendationDate || '23 Aug 2026';
                const recPrice = sig.recommendationPrice || sig.currentPrice;

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isHighProb ? 'rgba(139,92,246,0.03)' : 'transparent' }}>
                    <td style={{ padding: '0.85rem 1rem' }} className="mono">
                      <div style={{ fontSize: '0.8rem', color: '#fff' }}>{recDate}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{sig.name}</div>
                      <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sig.symbol} • {sig.type}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${isBuy ? 'badge-bullish' : 'badge-bearish'}`} style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}>
                        {sig.signalType}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fbbf24' }}>
                      ₹{recPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#38bdf8' }}>
                      ₹{sig.currentPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#f87171' }}>
                      ₹{sig.stopLoss.toLocaleString('en-IN')}
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#34d399' }}>
                      ₹{sig.targetPrice.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${isHighProb ? 'badge-bullish' : 'badge-neutral'}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {isHighProb ? `🔥 ${sig.probSuccess}% HIGH PROB` : `${sig.probSuccess}%`}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-bullish" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                        {sig.status || 'ACTIVE (Tracking SL/TP)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
