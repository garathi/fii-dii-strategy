import React from 'react';
import { TrendingUp, TrendingDown, Layers, ShieldCheck, Activity } from 'lucide-react';

export default function SentimentGauge({ analysis, rawData, onTriggerSignal, isTriggering }) {
  if (!analysis) return null;

  const score = analysis.sentimentScore || 0;
  const angle = ((score + 100) / 200) * 180;

  const fiiNet = analysis.fiiNet || 0;
  const diiNet = analysis.diiNet || 0;
  const combinedNet = analysis.combinedNet || 0;
  const oiDetails = analysis.openInterestDetails || {};
  const rawOi = rawData?.openInterest || {};

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Institutional Market Sentiment</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Official NSE Cash Flows & Participant Open Interest (OI)
          </p>
        </div>
        <span className={`badge badge-${analysis.sentiment.toLowerCase().includes('bullish') ? 'bullish' : (analysis.sentiment.toLowerCase().includes('bearish') ? 'bearish' : 'sideways')}`}>
          {analysis.badge}
        </span>
      </div>

      <div style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.25)', marginBottom: '1rem' }}>
        ℹ️ <strong>Open Interest (OI) Confluence Included:</strong> Calculates 50% Cash Flow + 50% Participant Futures & PCR Option Chain OI.
      </div>

      {/* SVG Radial Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.25rem 0' }}>
        <div style={{ position: 'relative', width: '260px', height: '145px' }}>
          <svg width="260" height="145" viewBox="0 0 200 110">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="16" strokeLinecap="round" />
            <path d="M 20 100 A 80 80 0 0 1 65 38" fill="none" stroke="#ef4444" strokeWidth="16" strokeDasharray="2,2" opacity="0.85" />
            <path d="M 65 38 A 80 80 0 0 1 135 38" fill="none" stroke="#f59e0b" strokeWidth="16" strokeDasharray="2,2" opacity="0.85" />
            <path d="M 135 38 A 80 80 0 0 1 180 100" fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray="2,2" opacity="0.85" />
            <g transform={`rotate(${angle - 90}, 100, 100)`}>
              <line x1="100" y1="100" x2="100" y2="32" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              <circle cx="100" cy="100" r="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
            </g>
          </svg>

          <div style={{ position: 'absolute', bottom: '0', width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: analysis.color }} className="mono">
              {score > 0 ? `+${score}` : score}
            </span>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sentiment Score (-100 to +100)
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown (Cash vs OI) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.25rem', fontSize: '0.78rem' }}>
        <span style={{ background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          Cash Flow Weight: <strong className="mono" style={{ color: analysis.cashScore >= 0 ? '#34d399' : '#f87171' }}>{analysis.cashScore >= 0 ? `+${analysis.cashScore}` : analysis.cashScore} pts</strong>
        </span>
        <span style={{ background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          OI & PCR Weight: <strong className="mono" style={{ color: analysis.oiScore >= 0 ? '#34d399' : '#f87171' }}>{analysis.oiScore >= 0 ? `+${analysis.oiScore}` : analysis.oiScore} pts</strong>
        </span>
      </div>

      {/* Open Interest (OI) Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>FII Futures Long/Short</div>
          <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
            {oiDetails.fiiFuturesRatio || rawOi.fiiLongShortRatio || '1.38'} Ratio
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Put-Call Ratio (PCR OI)</div>
          <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.2rem' }}>
            {oiDetails.pcrOi || rawOi.pcrOi || '1.15'} PCR
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Combined Cash Flow</div>
          <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: combinedNet >= 0 ? '#34d399' : '#f87171', marginTop: '0.2rem' }}>
            ₹{combinedNet.toLocaleString('en-IN')} Cr
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.08)', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Strategy Trigger Mode: <strong style={{ color: '#fff' }}>9:30 AM Intraday Execution</strong>
        </div>
        <button className="btn-primary" onClick={onTriggerSignal} disabled={isTriggering} style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}>
          {isTriggering ? 'Executing Signal...' : '⚡ Trigger Automated Signal'}
        </button>
      </div>
    </div>
  );
}
