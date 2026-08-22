import React, { useState, useEffect } from 'react';
import { Award, ShieldAlert, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

export default function RohanMehtaAthStrategy() {
  const [athData, setAthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/strategy/rohan-mehta-ath')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAthData(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Screening Nifty 500 for Rohan Mehta ATH & ATH Profit Multi-Bagger Picks...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Strategy Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Award size={18} /> ₹1500 Crore PMS Quantitative Model (Turtle Wealth)
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
              Rohan Mehta ATH & ATH Profit Strategy
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: '1.4' }}>
              Source: <em>"1500 Crore Fund Manager Who ONLY Buys Stocks At All-Time High | Kushal Lodha #368 (Timestamp 5365s)"</em>
            </p>
          </div>
          <a 
            href="https://www.youtube.com/watch?v=PRRsTuLKIdw&t=5365s" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', background: '#ef4444' }}
          >
            Watch Video at 5365s ↗
          </a>
        </div>

        {/* 4 Quantitative Rules Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginTop: '1.25rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>RULE 1</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>All-Time High Price</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Trading within 0–10% of Peak ATH</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>RULE 2</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>All-Time High Profit</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>TTM Net Profit PAT &gt; +20% Growth</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>RULE 3</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>Nifty 500 Outperformance</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Alpha &gt; +15% over Nifty 500</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700 }}>RULE 4</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>Exit First Philosophy</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Strict -12% Trailing Stop-Loss from Peak</div>
          </div>
        </div>
      </div>

      {/* Qualified ATH Buy Recommendations */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} style={{ color: '#34d399' }} /> Qualified Rohan Mehta ATH Buy Stocks ({athData?.qualifiedBuyCount})
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Stock & Segment</th>
                <th style={{ padding: '0.75rem 1rem' }}>Live CMP (₹)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Peak ATH High</th>
                <th style={{ padding: '0.75rem 1rem' }}>TTM PAT Growth (%)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Nifty 500 Alpha</th>
                <th style={{ padding: '0.75rem 1rem' }}>Trailing SL (-12%)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Rohan Mehta Signal</th>
              </tr>
            </thead>
            <tbody>
              {athData?.athBuyPicks?.map((stock) => (
                <tr key={stock.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{stock.symbol}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stock.name}</div>
                  </td>
                  <td className="mono" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fff' }}>
                    ₹{stock.cmp?.toLocaleString('en-IN')}
                  </td>
                  <td className="mono" style={{ padding: '0.85rem 1rem', color: '#fbbf24', fontWeight: 700 }}>
                    ₹{stock.peakHigh?.toLocaleString('en-IN')}
                    <div style={{ fontSize: '0.7rem', color: '#34d399' }}>{stock.distFromAthPct}% from ATH</div>
                  </td>
                  <td className="mono" style={{ padding: '0.85rem 1rem', color: '#34d399', fontWeight: 700 }}>
                    +{stock.ttmProfitGrowthPct}% (₹{stock.ttmProfitCr} Cr)
                  </td>
                  <td className="mono" style={{ padding: '0.85rem 1rem', color: '#38bdf8', fontWeight: 700 }}>
                    +{stock.outperformanceAlphaPct}% Alpha
                  </td>
                  <td className="mono" style={{ padding: '0.85rem 1rem', color: '#f87171', fontWeight: 700 }}>
                    ₹{stock.trailingStopLossPrice}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-bullish">
                      {stock.signal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Exit First Alert Table */}
      {athData?.exitPicks?.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(239,68,68,0.3)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f87171', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} /> "Exit First" Mandatory Exit Triggers ({athData?.exitTriggerCount})
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Rohan Mehta Rule: When a stock falls &gt;12% below its Peak High, exit immediately with zero emotional bias.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Stock</th>
                  <th style={{ padding: '0.75rem 1rem' }}>CMP (₹)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Peak High (₹)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Drawdown from Peak</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Exit Action Strategy</th>
                </tr>
              </thead>
              <tbody>
                {athData?.exitPicks?.map((stock) => (
                  <tr key={stock.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fff' }}>{stock.symbol}</td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', color: '#f87171', fontWeight: 700 }}>₹{stock.cmp}</td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', color: '#fbbf24' }}>₹{stock.peakHigh}</td>
                    <td className="mono" style={{ padding: '0.85rem 1rem', color: '#f87171', fontWeight: 700 }}>-{stock.distFromAthPct}%</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      {stock.actionAdvice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
