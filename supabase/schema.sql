-- ============================================================
-- Bet On Yourself — Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ============================================================

-- Profiles (one per auth user)
CREATE TABLE profiles (
  id          UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username    TEXT,
  bankroll    NUMERIC DEFAULT 10000,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Bets
CREATE TABLE bets (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT NOT NULL DEFAULT 'other',  -- fitness, sleep, food, work, social, other
  emoji            TEXT NOT NULL DEFAULT '🎯',
  stake            NUMERIC NOT NULL,
  target_checkins  INTEGER NOT NULL,               -- e.g. 4 (go to gym 4x)
  goal_type        TEXT NOT NULL DEFAULT 'at_least' CHECK (goal_type IN ('at_least', 'at_most')),
                                                    -- at_least: hit target_checkins+ to win. at_most: stay at/under target_checkins to win.
  start_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date         DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active', -- active, won, lost
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Daily check-ins per bet
CREATE TABLE checkins (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_id      UUID REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  completed   BOOLEAN DEFAULT TRUE,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bet_id, date)  -- one check-in per bet per day
);

-- Bankroll history (audit trail)
CREATE TABLE bankroll_history (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  change     NUMERIC NOT NULL,      -- positive = won, negative = lost
  balance    NUMERIC NOT NULL,      -- balance after this change
  reason     TEXT,
  bet_id     UUID REFERENCES bets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security — users can only see their own data
-- ============================================================
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bankroll_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users manage own bets"
  ON bets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own checkins"
  ON checkins FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own bankroll history"
  ON bankroll_history FOR ALL USING (auth.uid() = user_id);
