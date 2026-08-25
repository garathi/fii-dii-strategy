import React, { useState, useEffect } from 'react';
import { Target, ShieldAlert, TrendingUp, TrendingDown, RefreshCw, Filter, Clock, CheckCircle, Globe } from 'lucide-react';
import Loader from './Loader';

export default function TripleConfirmationStrategy() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assetCategory, setAssetCategory] = useState('ALL'); // ALL, STOCKS, CURRENCY
  const [signalFilter, setSignalFilter] = useState('ALL'); // ALL, BUY, SELL
  const [onlyHighProb, setOnlyHighProb] = useState(false);

  const fetchTripleData = (isBackground = false) => {
    if (!isBackground) setLoading(true);
    fetch('/api/strategy/triple-confirmation')
      .then(res => res.json())
      .then(resData => {
        if (resData.success) setData(resData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTripleData(false);
    const interval = setInterval(() => fetchTripleData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const allSignals = data?.signals || [];
  
  let filteredSignals = allSignals;

  // Filter 1: Asset Category
  if (assetCategory === 'STOCKS') {
    filteredSignals = filteredSignals.filter(s => s.type !== 'NSE / BSE F&O Traded' && s.type !== 'Currency Pair');
  } else if (assetCategory === 'CURRENCY') {
    filteredSignals = filteredSignals.filter(s => s.type === 'NSE / BSE F&O Traded' || s.type === 'Currency Pair');
  }

  // Filter 2: Signal Type (BUY vs SELL)
  if (signalFilter === 'BUY') {
    filteredSignals = filteredSignals.filter(s => s.signalType.includes('BUY'));
  } else if (signalFilter === 'SELL') {
    filteredSignals = filteredSignals.filter(s => s.signalType.includes('SELL'));
  }

  // Filter 3: High Probability Threshold (>=70%)
  if (onlyHighProb) {
    filteredSignals = filteredSignals.filter(s => s.probSuccess >= 70.0);
  }

  const buyCallsCount = filteredSignals.filter(s => s.signalType.includes('BUY')).length;
  const sellCallsCount = filteredSignals.filter(s => s.signalType.includes('SELL')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(37,99,235,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Globe size={18} /> Stocks, F&O Indices & NSE Currency Pairs Scanner
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
              20 DMA + 100 DMA + RSI Triple Confirmation Strategy
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Scans Indian Stocks, Indices, and Official NSE/BSE Currency Pairs (USD/INR, EUR/INR, GBP/INR, JPY/INR) with exact SL & Target.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => fetchTripleData(false)} style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', background: 'var(--accent-cyan)', color: '#000', fontWeight: 700 }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Rescan All Pairs
            </button>
          </div>
        </div>

        {/* Comprehensive Filters Bar */}
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.2rem' }}>
            Filters:
          </span>

          {/* Asset Category Filters */}
          <button
            onClick={() => setAssetCategory('ALL')}
            className={`btn-secondary ${assetCategory === 'ALL' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: assetCategory === 'ALL' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : '' }}
          >
            All Assets ({allSignals.length})
          </button>

          <button
            onClick={() => setAssetCategory('CURRENCY')}
            className={`btn-secondary ${assetCategory === 'CURRENCY' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: assetCategory === 'CURRENCY' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : '' }}
          >
            <Globe size={13} /> NSE Currency Pairs ({allSignals.filter(s => s.type === 'NSE / BSE F&O Traded' || s.type === 'Currency Pair').length})
          </button>

          <button
            onClick={() => setAssetCategory('STOCKS')}
            className={`btn-secondary ${assetCategory === 'STOCKS' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: assetCategory === 'STOCKS' ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)' : '' }}
          >
            Stocks & Indices ({allSignals.filter(s => s.type !== 'NSE / BSE F&O Traded' && s.type !== 'Currency Pair').length})
          </button>

          {/* Direction Call Filters */}
          <button
            onClick={() => setSignalFilter(signalFilter === 'BUY' ? 'ALL' : 'BUY')}
            className={`btn-secondary ${signalFilter === 'BUY' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: signalFilter === 'BUY' ? '#34d399' : '', color: signalFilter === 'BUY' ? '#000' : '' }}
          >
            BUY Calls Only
          </button>

          <button
            onClick={() => setSignalFilter(signalFilter === 'SELL' ? 'ALL' : 'SELL')}
            className={`btn-secondary ${signalFilter === 'SELL' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: signalFilter === 'SELL' ? '#f87171' : '', color: signalFilter === 'SELL' ? '#fff' : '' }}
          >
            SELL Calls Only
          </button>

          {/* Probability Filter */}
          <button
            onClick={() => setOnlyHighProb(!onlyHighProb)}
            className={`btn-secondary ${onlyHighProb ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: onlyHighProb ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : '', marginLeft: 'auto' }}
          >
            <Filter size={13} /> {onlyHighProb ? 'High Prob (≥70%) ON' : 'Filter: High Prob (≥70%)'}
          </button>
        </div>
      </div>

      {/* Signal Cards Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={18} style={{ color: '#8b5cf6' }} /> Active Triple Confirmation Signals ({filteredSignals.length} Listed)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Scanned: {data?.scannedAt ? new Date(data.scannedAt).toLocaleTimeString() : 'Just Now'}
          </span>
        </div>

        {loading && filteredSignals.length === 0 ? (
          <Loader message="Scanning NSE Currency Pairs & Stocks..." minHeight="200px" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Recommendation Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Instrument / Currency Pair</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Signal Call</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Rec. Entry Rate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Current Live Rate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Exact Stop Loss</th>
                  <th style={{ padding: '0.75rem 1rem' }}>1:2 Target Price</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Success Prob</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Lifecycle Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignals.map((sig, idx) => {
                  const isBuy = sig.signalType.includes('BUY');
                  const isHighProb = sig.probSuccess >= 70.0;
                  const recDate = sig.recommendationDate || '23 Aug 2026 09:30 AM';
                  const recPrice = sig.recommendationPrice || sig.currentPrice;
                  const isTargetHit = sig.status === 'TARGET_HIT';
                  const isSlHit = sig.status === 'SL_HIT';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isTargetHit ? 'rgba(52,211,153,0.05)' : isSlHit ? 'rgba(248,113,113,0.05)' : isHighProb ? 'rgba(139,92,246,0.03)' : 'transparent' }}>
                      <td style={{ padding: '0.85rem 1rem' }} className="mono">
                        <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{recDate}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{sig.name}</div>
                        <div className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{sig.symbol} • {sig.type}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${isBuy ? 'badge-bullish' : 'badge-bearish'}`} style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}>
                          {sig.signalType}
                        </span>
                      </td>
                      <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fbbf24' }}>
                        ₹{sig.currentPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#38bdf8' }}>
                        ₹{sig.currentPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#f87171' }}>
                        ₹{sig.stopLoss > 0 ? sig.stopLoss.toLocaleString('en-IN') : 'Trailing'}
                      </td>
                      <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#34d399' }}>
                        ₹{sig.targetPrice > 0 ? sig.targetPrice.toLocaleString('en-IN') : 'Trailing'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${isHighProb ? 'badge-bullish' : 'badge-neutral'}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          {isHighProb ? `🔥 ${sig.probSuccess}% HIGH PROB` : `${sig.probSuccess}%`}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isTargetHit ? (
                          <span className="badge badge-bullish" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', background: '#34d399', color: '#000', fontWeight: 800 }}>
                            ✓ TARGET HIT (Retained 2 Days)
                          </span>
                        ) : isSlHit ? (
                          <span className="badge badge-bearish" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', background: '#f87171', color: '#fff', fontWeight: 800 }}>
                            🛑 SL HIT (Retained 2 Days)
                          </span>
                        ) : (
                          <span className="badge badge-bullish" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                            ACTIVE (Tracking SL/TP)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
