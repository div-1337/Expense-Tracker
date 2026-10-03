'use client';

import React, { useState, useEffect } from 'react';
import { X, Cloud, Check, Copy, ExternalLink, ShieldCheck, Database, Rocket, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured, getSupabaseConfig, supabase } from '../lib/supabaseClient';
import { checkSupabaseHealth } from '../lib/storage';

export default function SupabaseSetupModal({ isOpen, onClose }) {
  const [copiedSql, setCopiedSql] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrlInput(cfg.url || '');
      setKeyInput(cfg.key || '');
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sqlSchema = `-- ==========================================================
-- DAILY FLAT/MESS & MAID TRACKER - SUPABASE DATABASE SCHEMA
-- ==========================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Topics Table
CREATE TABLE IF NOT EXISTS tracker_topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Check',
  color TEXT DEFAULT '#10B981',
  type TEXT NOT NULL DEFAULT 'people',
  people JSONB DEFAULT '[]'::jsonb,
  monthly_salary NUMERIC DEFAULT NULL,
  default_rate NUMERIC DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Daily Check-ins Table
CREATE TABLE IF NOT EXISTS tracker_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_ist DATE NOT NULL,
  topic_id TEXT NOT NULL,
  item_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  count INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date_ist, topic_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_checkins_date_ist ON tracker_checkins(date_ist);
CREATE INDEX IF NOT EXISTS idx_checkins_topic_id ON tracker_checkins(topic_id);

ALTER TABLE tracker_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read tracker_topics" ON tracker_topics FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update tracker_topics" ON tracker_topics FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read tracker_checkins" ON tracker_checkins FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update tracker_checkins" ON tracker_checkins FOR ALL USING (true) WITH CHECK (true);

INSERT INTO tracker_topics (id, name, icon, color, type, people, default_rate)
VALUES 
  ('topic_lunch', 'Lunch', 'Utensils', '#F59E0B', 'people', '["Divyam", "Kanishk"]'::jsonb, 60),
  ('topic_dinner', 'Dinner', 'Moon', '#8B5CF6', 'people', '["Divyam", "Kanishk"]'::jsonb, 70),
  ('topic_maid', 'Maid Presence', 'Sparkles', '#06B6D4', 'presence', '[]'::jsonb, NULL)
ON CONFLICT (id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE tracker_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE tracker_checkins;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await checkSupabaseHealth();
      setTestResult(res);
    } catch (err) {
      setTestResult({ connected: false, reason: 'exception', message: err.message });
    }
    setIsTesting(false);
  };

  const handleSaveKeys = () => {
    if (typeof window !== 'undefined') {
      if (urlInput.trim()) window.localStorage.setItem('supabase_url', urlInput.trim());
      if (keyInput.trim()) window.localStorage.setItem('supabase_anon_key', keyInput.trim());
      setSaveMsg('Keys saved! Reloading to activate...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={22} color="var(--emerald)" />
            <h3 className="modal-title">Supabase Cloud Database Status & Setup</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {/* Live Status Card */}
          <div
            style={{
              padding: '0.9rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              background: testResult?.connected
                ? 'rgba(16, 185, 129, 0.12)'
                : testResult?.reason === 'tables_missing'
                ? 'rgba(244, 63, 94, 0.12)'
                : 'rgba(245, 158, 11, 0.12)',
              border: `1.5px solid ${
                testResult?.connected
                  ? 'var(--emerald)'
                  : testResult?.reason === 'tables_missing'
                  ? 'var(--rose)'
                  : 'var(--amber)'
              }`,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            {testResult?.connected ? (
              <CheckCircle2 size={24} color="var(--emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : testResult?.reason === 'tables_missing' ? (
              <AlertTriangle size={24} color="var(--rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <Cloud size={24} color="var(--amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.98rem' }}>
                  {testResult?.connected
                    ? '🟢 Supabase SQL Database Connected!'
                    : testResult?.reason === 'tables_missing'
                    ? '🔴 SQL Tables Missing in Supabase!'
                    : '🟡 Local Mode (Cloud Not Connected)'}
                </strong>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem'
                  }}
                >
                  <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
                  <span>{isTesting ? 'Testing...' : 'Re-test'}</span>
                </button>
              </div>

              <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0', color: testResult?.reason === 'tables_missing' ? 'var(--rose)' : 'inherit' }}>
                {testResult?.message || (isTesting ? 'Pinging Supabase...' : 'Checking database status...')}
              </p>
            </div>
          </div>

          {/* If tables are missing or not run yet, show the SQL Run instructions first */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={16} color="var(--cyan)" />
              <span>Step 1: Run SQL Script in Supabase (Required for saving!)</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
              If you haven't run this script, Supabase does not have the <code>tracker_topics</code> and <code>tracker_checkins</code> tables, so data cannot be stored.
            </p>
            <ol style={{ paddingLeft: '1.25rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px', margin: '0 0 0.85rem 0' }}>
              <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: 'var(--emerald)', textDecoration: 'underline' }}>Supabase Project Dashboard <ExternalLink size={11} /></a>.</li>
              <li>Click on <strong>SQL Editor</strong> on the left sidebar.</li>
              <li>Click <strong>New Query</strong>, paste the script below, and click <strong>RUN</strong>.</li>
            </ol>

            <button
              type="button"
              onClick={copySql}
              className="submit-modal-btn"
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                fontSize: '0.86rem',
                borderRadius: '8px',
                background: copiedSql ? 'var(--emerald)' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {copiedSql ? <Check size={18} /> : <Copy size={18} />}
              <span>{copiedSql ? '✓ SQL Script Copied to Clipboard!' : 'Copy Full Supabase SQL Script'}</span>
            </button>
          </div>

          {/* Step 2: Keys in Vercel or Browser */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
              Step 2: Supabase API Keys
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
              Found in Supabase <strong>Project Settings → API</strong>. Add them in Vercel Environment Variables (as <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) OR paste them below:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Project URL</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Anon Public Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--emerald)' }}>{saveMsg}</span>
                <button
                  type="button"
                  onClick={handleSaveKeys}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '6px',
                    background: 'var(--emerald)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Save Keys & Reconnect
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn-primary" style={{ width: 'auto', padding: '8px 18px', fontSize: '0.88rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
