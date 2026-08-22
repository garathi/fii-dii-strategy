import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, BarChart2, Zap, Sliders, PlayCircle, Layers, Award, ShieldCheck } from 'lucide-react';
import SentimentGauge from './components/SentimentGauge';
import FiiDiiChart from './components/FiiDiiChart';
import StrategyCards from './components/StrategyCards';
import BacktestSimulator from './components/BacktestSimulator';
import AutomationConfig from './components/AutomationConfig';
import StockScreener from './components/StockScreener';
import RohanMehtaAthStrategy from './components/RohanMehtaAthStrategy';
import ActivePositionTracker from './components/ActivePositionTracker';
import InstitutionalRatioStrategy from './components/InstitutionalRatioStrategy';

export default function App() {
  const [todayData, setTodayData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [tradeLogs, setTradeLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [todayRes, historyRes, logsRes, settingsRes] = await Promise.all([
        fetch('/api/fii-dii/today').then(res => res.json()),
        fetch('/api/fii-dii/history?days=30').then(res => res.json()),
        fetch('/api/trade-log').then(res => res.json()),
        fetch('/api/settings').then(res => res.json())
      ]);

      if (todayRes.success) setTodayData(todayRes);
      if (historyRes.success) setHistoryData(historyRes.history);
      if (logsRes.success) setTradeLogs(logsRes.trades);
      if (settingsRes.success) setSettings(settingsRes.settings);
      
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error fetching FII/DII data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
    const ws = new WebSocket(`${wsProtocol}//${wsHost}`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'TICKER_UPDATE') {
          setTodayData(prev => prev ? { ...prev, analysis: payload.data } : prev);
        }
      } catch (e) {}
    };

    return () => ws.close();
  }, []);

  const handleTriggerSignal = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/trigger-signal', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const logsRes = await fetch('/api/trade-log').then(r => r.json());
        if (logsRes.success) setTradeLogs(logsRes.trades);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      {/* Top Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #2563eb, #8b5cf6)', padding: '0.65rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
            <Activity size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              FII & DII Strategy Automation
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              1:2 Institutional Ratio Tracker & Real-Time Rate Updates
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span className="live-pulse"></span>
            NSE Market Feed: <strong style={{ color: '#34d399' }}>Active</strong>
          </div>
          <button className="btn-secondary" onClick={fetchData} disabled={loading} style={{ background: 'var(--accent-cyan)', color: '#000', fontWeight: 700 }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh All Rates
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn-secondary ${activeTab === 'dashboard' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          style={{ background: activeTab === 'dashboard' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : '' }}
        >
          <BarChart2 size={16} /> Live Dashboard
        </button>
        <button
          className={`btn-secondary ${activeTab === 'ratio' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('ratio')}
          style={{ background: activeTab === 'ratio' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : '' }}
        >
          <ShieldCheck size={16} /> 1:2 Institutional Ratio
        </button>
        <button
          className={`btn-secondary ${activeTab === 'rohan' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('rohan')}
          style={{ background: activeTab === 'rohan' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : '' }}
        >
          <Award size={16} /> Rohan Mehta ATH Strategy
        </button>
        <button
          className={`btn-secondary ${activeTab === 'stocks' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('stocks')}
          style={{ background: activeTab === 'stocks' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : '' }}
        >
          <Layers size={16} /> Nifty 500 Screener
        </button>
        <button
          className={`btn-secondary ${activeTab === 'backtest' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('backtest')}
          style={{ background: activeTab === 'backtest' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : '' }}
        >
          <PlayCircle size={16} /> Backtest Simulator
        </button>
        <button
          className={`btn-secondary ${activeTab === 'settings' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('settings')}
          style={{ background: activeTab === 'settings' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : '' }}
        >
          <Sliders size={16} /> Automation Settings
        </button>
      </nav>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          <ActivePositionTracker key={`pos-${refreshKey}`} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <SentimentGauge
              analysis={todayData?.analysis}
              rawData={todayData?.raw}
              onTriggerSignal={handleTriggerSignal}
              isTriggering={isTriggering}
            />
            <FiiDiiChart history={historyData} />
          </div>

          <StrategyCards
            strategy={todayData?.analysis?.recommendedStrategy}
            tradeLogs={tradeLogs}
            onTriggerSignal={handleTriggerSignal}
            isTriggering={isTriggering}
          />
        </>
      )}

      {/* Dedicated 1:2 Ratio Strategy Tab */}
      {activeTab === 'ratio' && (
        <InstitutionalRatioStrategy key={`ratio-${refreshKey}`} />
      )}

      {/* Rohan Mehta ATH Strategy Tab */}
      {activeTab === 'rohan' && (
        <RohanMehtaAthStrategy key={`rohan-${refreshKey}`} />
      )}

      {/* Stock Screener Tab */}
      {activeTab === 'stocks' && (
        <StockScreener key={`stocks-${refreshKey}`} />
      )}

      {/* Backtest Simulator Tab */}
      {activeTab === 'backtest' && (
        <BacktestSimulator />
      )}

      {/* Automation Settings Tab */}
      {activeTab === 'settings' && settings && (
        <AutomationConfig settings={settings} onSaveSettings={handleSaveSettings} />
      )}
    </div>
  );
}
