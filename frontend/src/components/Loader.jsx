import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ message = "Loading...", minHeight = "300px" }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: minHeight,
      width: '100%',
      gap: '1rem',
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <Loader2 size={36} className="spin" style={{ color: 'var(--accent-cyan)' }} />
      <div style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '0.95rem', 
        fontWeight: 600,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}>
        {message}
      </div>
    </div>
  );
}
