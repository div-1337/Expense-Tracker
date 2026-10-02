'use client';

import React, { useState } from 'react';
import { X, Cloud, Check, Copy, ExternalLink, ShieldCheck, Database, Rocket } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function SupabaseSetupModal({ isOpen, onClose }) {
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- Run this in your Supabase SQL Editor:
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

ALTER TABLE tracker_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read" ON tracker_topics FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON tracker_topics FOR ALL USING (true);
CREATE POLICY "Allow all read checkins" ON tracker_checkins FOR SELECT USING (true);
CREATE POLICY "Allow all write checkins" ON tracker_checkins FOR ALL USING (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={22} color="var(--emerald)" />
            <h3 className="modal-title">Free Cloud Database & Phone Sync</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: isSupabaseConfigured
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(99, 102, 241, 0.12)',
              border: `1px solid ${
                isSupabaseConfigured
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'rgba(99, 102, 241, 0.3)'
              }`,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <ShieldCheck size={20} color={isSupabaseConfigured ? 'var(--emerald)' : 'var(--violet)'} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>
                {isSupabaseConfigured ? 'Supabase is Connected & Live!' : 'Currently in Local-First Mode'}
              </strong>
              <div style={{ fontSize: '0.8rem' }}>
                {isSupabaseConfigured
                  ? 'All roommate phones sync automatically in real-time!'
                  : 'Your ticks are saved safely in your browser. Connect free Supabase cloud so all roommates can tick from their phones.'}
              </div>
            </div>
          </div>

          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={16} color="var(--cyan)" />
            <span>3-Step 100% Free Setup (Takes 2 minutes):</span>
          </h4>

          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <li>
              <strong>Create a free Supabase project:</strong> Go to{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--emerald)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                supabase.com <ExternalLink size={12} />
              </a>{' '}
              and create a free organization & database.
            </li>
            <li>
              <strong>Run Database Schema:</strong> Open Supabase <em>SQL Editor</em>, paste the script below, and click <em>Run</em>:
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={copySql}
                  className="cloud-status-btn"
                  style={{ width: '100%', justifyContent: 'center', padding: '8px', background: 'rgba(255,255,255,0.06)' }}
                >
                  {copiedSql ? <Check size={16} color="var(--emerald)" /> : <Copy size={16} />}
                  <span>{copiedSql ? 'SQL Script Copied!' : 'Copy Supabase SQL Script'}</span>
                </button>
              </div>
            </li>
            <li>
              <strong>Add API Keys to .env.local:</strong> In Supabase <em>Project Settings → API</em>, copy your <code>Project URL</code> and <code>anon public key</code> into your <code>.env.local</code> file:
              <pre
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  marginTop: '6px',
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)'
                }}
              >
{`NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...`}
              </pre>
            </li>
          </ol>

          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Rocket size={18} color="var(--amber)" />
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>Deploy Free to Vercel</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Push to GitHub and import to vercel.com for 0 cold starts</div>
              </div>
            </div>
            <button onClick={onClose} className="btn-primary" style={{ width: 'auto', padding: '6px 14px', fontSize: '0.85rem' }}>
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
