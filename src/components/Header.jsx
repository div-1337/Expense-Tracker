'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentISTTime, getMillisUntilMidnightIST, formatCountdown } from '../lib/dateUtils';
import { Clock, Cloud, CloudOff, CheckCircle2, BarChart3, Calendar, Sparkles } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function Header({ activeTab, setActiveTab, onOpenCloudSetup }) {
  const [istTime, setIstTime] = useState('');
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setIstTime(getCurrentISTTime());
      const msLeft = getMillisUntilMidnightIST();
      setCountdown(formatCountdown(msLeft));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-header">
      <div className="header-brand-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle2 size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, lineHeight: 1.15 }}>
              Flat & Routine Tracker
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Meals • Maid • Daily Resets & Split
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onOpenCloudSetup}
            className={`cloud-status-btn ${isSupabaseConfigured ? 'connected' : ''}`}
            title="Cloud Sync Setup"
          >
            {isSupabaseConfigured ? (
              <>
                <Cloud size={15} color="var(--emerald)" />
                <span>Supabase Live</span>
              </>
            ) : (
              <>
                <CloudOff size={15} color="var(--amber)" />
                <span>Local Mode (Connect Cloud)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* IST Live Banner & Midnight Reset Clock */}
      <div className="ist-banner glass-card">
        <div className="ist-time-group">
          <span className="pulse-dot" />
          <Clock size={16} color="var(--emerald)" />
          <span>IST: {istTime || 'Loading...'}</span>
          <span className="brand-badge" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
            GMT +5:30
          </span>
        </div>

        <div className="reset-countdown">
          <span>⏳ Resets in:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{countdown || '--:--:--'}</span>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <nav className="nav-tabs">
        <button
          onClick={() => setActiveTab('daily')}
          className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
        >
          <Calendar size={17} />
          <span>Daily Checkmarks</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
        >
          <BarChart3 size={17} />
          <span>Monthly Analysis & Split</span>
        </button>
      </nav>
    </header>
  );
}
