import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Activity, BarChart2, CheckCircle2, XCircle } from 'lucide-react';
import Loader from './Loader';

export default function HemantSwingStrategy() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/screener/hemant-swing');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={24} style={{ color: '#38bdf8' }} /> 
            Hemant Jain "Value Trading" Swing Screener
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Automatically scans Nifty 500 for high-probability setups combining Trend (50/200 EMA), Momentum Pullbacks (RSI), and Institutional Volume Spikes.
          </p>
        </div>
        <button className="btn-primary" onClick={fetchSignals} disabled={loading}>
          <Activity size={18} /> Refresh Scan
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : !data || !data.stocks || data.stocks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            {data?.warning || "No data available. The Python engine might still be syncing."}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>STOCK / COMPANY</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>CMP</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>TREND (50/200 EMA)</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>RSI PULLBACK (40-60)</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>VOLUME SPIKE</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {data.stocks.map((stock, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: stock.isQualified ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{stock.cleanSymbol}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stock.name}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>
                    ₹{stock.cmp}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: (stock.cmp > stock.ema50 && stock.ema50 > stock.ema200) ? '#34d399' : '#f87171', fontSize: '0.9rem', fontWeight: 600 }}>
                      {(stock.cmp > stock.ema50 && stock.ema50 > stock.ema200) ? 'Uptrend' : 'Failed'}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>50: {stock.ema50} | 200: {stock.ema200}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: (stock.rsi >= 40 && stock.rsi <= 60) ? '#34d399' : '#f87171', fontSize: '0.9rem', fontWeight: 600 }}>
                      {stock.rsi}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: stock.volumeSpike >= 1.5 ? '#34d399' : '#f87171', fontSize: '0.9rem', fontWeight: 600 }}>
                      <BarChart2 size={14} /> {stock.volumeSpike}x Avg
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {stock.isQualified ? (
                      <span className="badge badge-bullish">
                        <CheckCircle2 size={12} /> ENTRY QUALIFIED
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <XCircle size={14} /> Failed Criteria
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
