import React from 'react';
import { Zap, History, CheckCircle, Layers } from 'lucide-react';

export default function StrategyCards({ strategy, tradeLogs = [], onTriggerSignal, isTriggering }) {
  if (!strategy) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Recommended Strategy Box */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.05em' }}>
                Automated Signal Recommendation
              </span>
              <span className="badge badge-bullish" style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem' }}>
                RECOMMENDED: {strategy.recommendedLots || 2} LOTS ({strategy.totalQuantity || 130} QTY)
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
              {strategy.name}
            </h2>
          </div>
          <button className="btn-primary" onClick={onTriggerSignal} disabled={isTriggering}>
            <Zap size={16} />
            {isTriggering ? 'Sending...' : `Auto-Execute ${strategy.recommendedLots || 2} Lots`}
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.1rem', lineHeight: '1.4' }}>
          {strategy.actionAdvice}
        </p>

        {/* Option Legs Table */}
        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Option Leg Instrument
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              Order Quantity & Lots
            </span>
          </div>
          {strategy.legs.map((leg, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: idx < strategy.legs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge ${leg.action === 'BUY' ? 'badge-bullish' : 'badge-bearish'}`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                  {leg.action}
                </span>
                <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                  NIFTY {leg.strike} {leg.optionType}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                  {leg.lots || strategy.recommendedLots || 2} Lots ({leg.qty || strategy.totalQuantity || 130} Qty)
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ~₹{leg.approxPrice} ({leg.expiry})
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Strategy Parameters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Req Margin</div>
            <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
              ₹{(strategy.approxMarginRequired || 90000).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Max Risk Total</div>
            <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171', marginTop: '0.2rem' }}>
              ₹{(strategy.maxRiskTotal || 14300).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Max Reward Total</div>
            <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
              ₹{(strategy.maxRewardTotal || 18200).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Risk : Reward</div>
            <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.2rem' }}>
              {strategy.riskRewardRatio}
            </div>
          </div>
        </div>
      </div>

      {/* Execution Log */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <History size={18} style={{ color: 'var(--accent-blue)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Automated Trade Execution Log</h2>
        </div>

        {tradeLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No trades executed yet. Click <strong>Auto-Execute 2 Lots</strong> above to fire live or simulated signal.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '330px', overflowY: 'auto' }}>
            {tradeLogs.map((log) => (
              <div key={log.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{log.id}</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                  {log.strategyName} (2 Lots / 130 Qty)
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Net Flow: ₹{log.combinedNet} Cr</span>
                  <span style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <CheckCircle size={12} /> {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
