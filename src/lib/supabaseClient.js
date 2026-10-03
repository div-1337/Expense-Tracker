import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://vznlgsmrkoiiljaapioq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_jtEOanvy1Pwz_28cZ-xaXg_6ZdTMSXM';

const getEnvOrLocal = (envKey, localKey, fallbackVal) => {
  if (process.env[envKey] && !process.env[envKey].includes('your-') && process.env[envKey].trim()) {
    return process.env[envKey].trim();
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = window.localStorage.getItem(localKey);
      if (val && !val.includes('your-') && val.trim()) return val.trim();
    } catch (e) {
      // ignore
    }
  }
  return fallbackVal;
};

export const getSupabaseConfig = () => {
  const url = getEnvOrLocal('NEXT_PUBLIC_SUPABASE_URL', 'supabase_url', DEFAULT_SUPABASE_URL);
  const key = getEnvOrLocal('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'supabase_anon_key', DEFAULT_SUPABASE_ANON_KEY);
  const configured = Boolean(
    url && 
    key && 
    !url.includes('your-project') && 
    !key.includes('your-anon-key')
  );
  return { url, key, configured };
};

const config = getSupabaseConfig();

export const isSupabaseConfigured = config.configured;

export const supabase = isSupabaseConfigured
  ? createClient(config.url, config.key)
  : null;

export function getClientSupabase() {
  const cfg = getSupabaseConfig();
  if (cfg.configured) {
    return createClient(cfg.url, cfg.key);
  }
  return null;
}
