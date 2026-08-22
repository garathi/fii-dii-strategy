import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw } from 'lucide-react';

export default function StockScreener() {
  const [stocksData, setStocksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('ALL');

  const fetchStockData = () => {
    setLoading(true);
    fetch('/api/fii-dii/stocks')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStocksData(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Fetching Real Live Market CMPs & SEBI Shareholding Patterns...
      </div>
    );
  }

  const stocksToDisplay = filterMode === 'BUY' 
    ? stocksData?.topBuyPicks 
    : (filterMode === 'SHORT' ? stocksData?.topShortPicks : stocksData?.allStocks);

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} style={{ color: 'var(--accent-cyan)' }} /> Institutional Stock Screener & Selection
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Real Live CMP Quotes (Yahoo Finance ^NSEI) & Official SEBI Quarterly Shareholding Patterns
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={fetchStockData} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh Prices
          </button>
          <button 
            className={`btn-secondary ${filterMode === 'ALL' ? 'btn-primary' : ''}`}
            onClick={() => setFilterMode('ALL')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
          >
            All Stocks ({stocksData?.summary?.totalScreened})
          </button>
          <button 
            className={`btn-secondary ${filterMode === 'BUY' ? 'btn-primary' : ''}`}
            onClick={() => setFilterMode('BUY')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: filterMode === 'BUY' ? '#10b981' : '' }}
          >
            Buy Picks ({stocksData?.summary?.institutionalBuyCount})
          </button>
          <button 
            className={`btn-secondary ${filterMode === 'SHORT' ? 'btn-primary' : ''}`}
            onClick={() => setFilterMode('SHORT')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: filterMode === 'SHORT' ? '#ef4444' : '' }}
          >
            Distribution Shorts ({stocksData?.summary?.institutionalShortCount})
          </button>
        </div>
      </div>

      {/* Stock Selection Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Stock Symbol</th>
              <th style={{ padding: '0.75rem 1rem' }}>Sector</th>
              <th style={{ padding: '0.75rem 1rem' }}>Live CMP (₹) & Day %</th>
              <th style={{ padding: '0.75rem 1rem' }}>Official SEBI Shareholding</th>
              <th style={{ padding: '0.75rem 1rem' }}>Signal</th>
              <th style={{ padding: '0.75rem 1rem' }}>Target / Stop Loss</th>
              <th style={{ padding: '0.75rem 1rem' }}>Action Strategy</th>
            </tr>
          </thead>
          <tbody>
            {stocksToDisplay?.map((stock) => (
              <tr key={stock.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{stock.symbol}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stock.name}</div>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{stock.sector}</td>
                <td className="mono" style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                    ₹{stock.cmp?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: (stock.changePct >= 0) ? '#34d399' : '#f87171' }}>
                    {(stock.changePct >= 0) ? `+${stock.changePct}%` : `${stock.changePct}%`}
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    FII: <strong style={{ color: '#38bdf8' }}>{stock.fiiHoldingPct}%</strong> | DII: <strong style={{ color: '#fbbf24' }}>{stock.diiHoldingPct}%</strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Inst Total: {Number((stock.fiiHoldingPct + stock.diiHoldingPct).toFixed(1))}%
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span className={`badge ${stock.badgeClass}`}>
                    {stock.signal}
                  </span>
                </td>
                <td className="mono" style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}>Tgt: ₹{stock.targetPrice}</div>
                  <div style={{ color: '#f87171', fontSize: '0.75rem' }}>SL: ₹{stock.stopLossPrice}</div>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', maxWidth: '280px' }}>
                  {stock.strategyAdvice}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
