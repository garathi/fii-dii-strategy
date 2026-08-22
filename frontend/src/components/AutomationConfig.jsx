import React, { useState } from 'react';
import { Settings, Save, Bell, Shield, Sliders } from 'lucide-react';

export default function AutomationConfig({ settings, onSaveSettings }) {
  const [formData, setFormData] = useState(settings || {
    minFiiThreshold: 500,
    minDiiThreshold: 300,
    riskPerTradePct: 2,
    telegramWebhookUrl: '',
    discordWebhookUrl: '',
    autoTradingEnabled: false
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Sliders size={20} style={{ color: 'var(--accent-purple)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Automation & Webhook Settings</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Strategy Parameters */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={16} style={{ color: '#38bdf8' }} /> Risk & Threshold Triggers
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Minimum FII Net Buy/Sell Threshold (₹ Crores)
            </label>
            <input
              type="number"
              value={formData.minFiiThreshold}
              onChange={(e) => setFormData({ ...formData, minFiiThreshold: Number(e.target.value) })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Minimum DII Net Buy/Sell Threshold (₹ Crores)
            </label>
            <input
              type="number"
              value={formData.minDiiThreshold}
              onChange={(e) => setFormData({ ...formData, minDiiThreshold: Number(e.target.value) })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Max Risk Per Trade (% of Account Equity)
            </label>
            <input
              type="number"
              value={formData.riskPerTradePct}
              onChange={(e) => setFormData({ ...formData, riskPerTradePct: Number(e.target.value) })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Notifications & Webhooks */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Bell size={16} style={{ color: '#fbbf24' }} /> Notification Webhooks
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Telegram Bot / Webhook URL
            </label>
            <input
              type="text"
              placeholder="https://api.telegram.org/bot<token>/sendMessage?chat_id=<id>"
              value={formData.telegramWebhookUrl}
              onChange={(e) => setFormData({ ...formData, telegramWebhookUrl: e.target.value })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Discord Webhook URL
            </label>
            <input
              type="text"
              placeholder="https://discord.com/api/webhooks/..."
              value={formData.discordWebhookUrl}
              onChange={(e) => setFormData({ ...formData, discordWebhookUrl: e.target.value })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-primary" type="submit">
              <Save size={16} /> Save Configuration
            </button>
            {isSaved && <span style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>✓ Saved!</span>}
          </div>
        </div>
      </form>
    </div>
  );
}
