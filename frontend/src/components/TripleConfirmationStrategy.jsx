import React, { useState, useEffect } from 'react';
import { Target, ShieldAlert, TrendingUp, TrendingDown, RefreshCw, Filter, Award, Zap } from 'lucide-react';

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
              <Zap size={18} /> Triple Confirmation Quantitative Scanner
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
              20 DMA + 100 DMA + RSI Triple Confirmation Strategy
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Scans F&O Indices & Nifty 50 stocks with exact Stop Loss (SL), 1:2 Target (TP), and Estimated Success Probability.
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

        {/* Strategy Rules Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginTop: '1.25rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Condition 1: Short Trend</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.15rem' }}>Price vs 20 DMA</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Condition 2: Trend Alignment</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa', marginTop: '0.15rem' }}>20 DMA vs 100 DMA</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Condition 3: Momentum</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.15rem' }}>RSI &gt; 55 (Buy) / &lt; 45 (Sell)</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>Active High Prob Calls</div>
            <div className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', marginTop: '0.15rem' }}>
              {filteredSignals.length} Calls ({buyCallsCount} BUY / {sellCallsCount} SHORT)
            </div>
          </div>
        </div>
      </div>

      {/* Signal Cards Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} style={{ color: '#8b5cf6' }} /> Active F&O Indices & Nifty 50 Triple Confirmation Calls
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Last Scanned: {data?.scannedAt ? new Date(data.scannedAt).toLocaleTimeString() : 'Just Now'}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Instrument & Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Signal Call</th>
                <th style={{ padding: '0.75rem 1rem' }}>Live Price (CMP)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Exact Stop Loss (SL)</th>
                <th style={{ padding: '0.75rem 1rem' }}>1:2 Target Price (TP)</th>
                <th style={{ padding: '0.75rem 1rem' }}>20 DMA / 100 DMA</th>
                <th style={{ padding: '0.75rem 1rem' }}>RSI (14)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Estimated Success Prob</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignals.map((sig, idx) => {
                const isBuy = sig.signalType === 'BUY';
                const isHighProb = sig.probSuccess >= 70.0;

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isHighProb ? 'rgba(139,92,246,0.03)' : 'transparent' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{sig.name}</div>
                      <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sig.symbol} • {sig.type}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${isBuy ? 'badge-bullish' : 'badge-bearish'}`} style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}>
                        {sig.signalType}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fff' }}>
                      ₹{sig.currentPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#f87171' }}>
                      ₹{sig.stopLoss.toLocaleString('en-IN')}
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#34d399' }}>
                      ₹{sig.targetPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ₹{sig.dma20} / ₹{sig.dma100}
                    </td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: isBuy ? '#34d399' : '#f87171' }}>
                      {sig.rsi}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${isHighProb ? 'badge-bullish' : 'badge-neutral'}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {isHighProb ? `🔥 ${sig.probSuccess}% HIGH PROB` : `${sig.probSuccess}%`}
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
