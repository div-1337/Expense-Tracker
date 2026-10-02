-- ==========================================================
-- DAILY FLAT/MESS & MAID TRACKER - SUPABASE DATABASE SCHEMA
-- ==========================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Topics Table (Lunch, Dinner, Maid Presence, Custom Topics)
CREATE TABLE IF NOT EXISTS tracker_topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Check',
  color TEXT DEFAULT '#10B981',
  type TEXT NOT NULL DEFAULT 'people', -- 'people' or 'presence'
  people JSONB DEFAULT '[]'::jsonb,   -- Array of member names: ["Divyam", "Kanishk"]
  monthly_salary NUMERIC DEFAULT NULL,
  default_rate NUMERIC DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Daily Check-ins Table (Date-keyed in IST timezone: 'YYYY-MM-DD')
CREATE TABLE IF NOT EXISTS tracker_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_ist DATE NOT NULL,
  topic_id TEXT NOT NULL,
  item_key TEXT NOT NULL,             -- Person's name (e.g., 'Divyam') or 'presence'
  completed BOOLEAN NOT NULL DEFAULT true,
  count INT NOT NULL DEFAULT 1,       -- Supports up to 3 guest plates (1=Self, 2=+1 Guest, 3=+2 Guests)
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date_ist, topic_id, item_key)
);

-- 3. Create Index for super-fast monthly queries
CREATE INDEX IF NOT EXISTS idx_checkins_date_ist ON tracker_checkins(date_ist);
CREATE INDEX IF NOT EXISTS idx_checkins_topic_id ON tracker_checkins(topic_id);

-- 4. Enable Row Level Security (RLS) with open read/write for app usage
ALTER TABLE tracker_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read tracker_topics" ON tracker_topics FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update tracker_topics" ON tracker_topics FOR ALL USING (true);

CREATE POLICY "Allow public read tracker_checkins" ON tracker_checkins FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update tracker_checkins" ON tracker_checkins FOR ALL USING (true);

-- 5. Seed default topics
INSERT INTO tracker_topics (id, name, icon, color, type, people, default_rate)
VALUES 
  ('topic_lunch', 'Lunch', 'Utensils', '#F59E0B', 'people', '["Divyam", "Kanishk"]'::jsonb, 60),
  ('topic_dinner', 'Dinner', 'Moon', '#8B5CF6', 'people', '["Divyam", "Kanishk"]'::jsonb, 70),
  ('topic_maid', 'Maid Presence', 'Sparkles', '#06B6D4', 'presence', '[]'::jsonb, NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. Enable Realtime Broadcasting (Instantly push ticks to all flatmate phones)
ALTER PUBLICATION supabase_realtime ADD TABLE tracker_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE tracker_checkins;
