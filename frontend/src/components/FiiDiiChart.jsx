import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';

export default function FiiDiiChart({ history }) {
  if (!history || history.length === 0) return null;

  const chartData = history.map(item => ({
    date: item.formattedDate,
    FII: item.fii.netValue,
    DII: item.dii.netValue,
    Combined: item.combinedNet,
    Nifty: item.niftyClose
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#0f172a', border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>{label}</div>
          <div style={{ color: '#34d399', fontSize: '0.85rem' }}>FII Net: ₹{payload[0]?.value?.toLocaleString('en-IN')} Cr</div>
          <div style={{ color: '#60a5fa', fontSize: '0.85rem' }}>DII Net: ₹{payload[1]?.value?.toLocaleString('en-IN')} Cr</div>
          <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            Nifty Index: {payload[2]?.payload?.Nifty?.toLocaleString('en-IN')}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>FII vs DII Net Cash Flow Trend</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Daily Institutional Net Buying / Selling (in ₹ Crores)</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }}></span> FII Net Flow
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#60a5fa' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6' }}></span> DII Net Flow
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#4b5563" />
            <Bar dataKey="FII" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="DII" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
