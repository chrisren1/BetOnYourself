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
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  witness_token    UUID,                           -- set when a shareable witness link is generated
  witness_verdict  BOOLEAN,                         -- witness's yes/no on whether the bet held up
  witness_voted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX bets_witness_token_idx ON bets (witness_token) WHERE witness_token IS NOT NULL;

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

-- ============================================================
-- Witness verification — a friend can confirm/deny a bet via a
-- shareable link with no account needed. Reads and writes go through
-- SECURITY DEFINER functions rather than a relaxed RLS policy, so
-- knowing the exact token — not row visibility — is what grants access.
-- ============================================================

CREATE OR REPLACE FUNCTION get_witness_bet(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bet RECORD;
BEGIN
  SELECT title, emoji, description, category, goal_type, target_checkins, stake, status, witness_verdict, witness_voted_at
  INTO v_bet
  FROM bets
  WHERE witness_token = p_token;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN row_to_json(v_bet);
END;
$$;

GRANT EXECUTE ON FUNCTION get_witness_bet(UUID) TO anon, authenticated;

-- Records the witness's yes/no and writes (or clears) today's check-in to
-- match: at_least bets, "yes" logs a check-in; at_most bets, "yes" (stayed
-- under) logs nothing and "no" (broke it) logs an occurrence.
CREATE OR REPLACE FUNCTION submit_witness_verdict(p_token UUID, p_success BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bet RECORD;
  v_today DATE := CURRENT_DATE;
  v_should_checkin BOOLEAN;
BEGIN
  SELECT * INTO v_bet FROM bets WHERE witness_token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'invalid_token');
  END IF;

  IF v_bet.status <> 'active' THEN
    RETURN json_build_object('error', 'already_settled');
  END IF;

  UPDATE bets
  SET witness_verdict = p_success, witness_voted_at = NOW()
  WHERE id = v_bet.id;

  v_should_checkin := (v_bet.goal_type = 'at_least' AND p_success)
                    OR (v_bet.goal_type = 'at_most' AND NOT p_success);

  IF v_should_checkin THEN
    INSERT INTO checkins (bet_id, user_id, date, completed, note)
    VALUES (v_bet.id, v_bet.user_id, v_today, TRUE, 'Confirmed by witness')
    ON CONFLICT (bet_id, date) DO UPDATE SET completed = TRUE, note = 'Confirmed by witness';
  ELSE
    DELETE FROM checkins WHERE bet_id = v_bet.id AND date = v_today;
  END IF;

  RETURN json_build_object('success', true, 'title', v_bet.title);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_witness_verdict(UUID, BOOLEAN) TO anon, authenticated;
