import React, { useState } from 'react';
import { Play, TrendingUp, BarChart2, Award, Percent } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function BacktestSimulator() {
  const [capital, setCapital] = useState(100000);
  const [days, setDays] = useState(60);
  const [backtestResult, setBacktestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunBacktest = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialCapital: capital, days })
      });
      const data = await res.json();
      if (data.success) {
        setBacktestResult(data.backtest);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const summary = backtestResult?.summary;

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Strategy Backtest & Performance Simulator</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Simulate FII/DII sentiment rules on historical Nifty & F&O data</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Initial Capital (₹)</label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '8px', width: '130px', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Backtest Horizon</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{ background: '#1e293b', border: '1px solid var(--border-color)', color: '#fff', padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>
          <button className="btn-primary" onClick={handleRunBacktest} disabled={isRunning} style={{ marginTop: '1rem' }}>
            <Play size={16} /> {isRunning ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* KPI Summary Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', margin: '1.25rem 0', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Profit / Loss</div>
              <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: summary.netPnL >= 0 ? '#34d399' : '#f87171' }}>
                ₹{summary.netPnL.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Return on Investment</div>
              <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: summary.roiPct >= 0 ? '#34d399' : '#f87171' }}>
                +{summary.roiPct}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Win Rate</div>
              <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
                {summary.winRate}% ({summary.wins}W / {summary.losses}L)
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Profit Factor</div>
              <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>
                {summary.profitFactor}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Drawdown</div>
              <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f87171' }}>
                -{summary.maxDrawdownPct}%
              </div>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <div style={{ width: '100%', height: 240, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={backtestResult.equityCurve}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Portfolio Value']} />
                <Area type="monotone" dataKey="capital" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#equityGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
