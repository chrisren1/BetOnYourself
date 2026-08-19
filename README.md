# Bet On Yourself

An accountability app that works like fantasy sports betting — except you're betting on yourself. Start with a $10,000 fake bankroll, make commitments, check in daily, and settle your bets at the end of the week.

---

## Setup (15 minutes)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run the database schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Paste the contents of `supabase/schema.sql` and click **Run**

### 4. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (for sharing with your 10 people)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Add the same env vars in Vercel's Environment Variables settings
4. Deploy — done. Share the URL with your testers.

---

## Upgrade: Add real AI coaching

When you're ready to wire in real Claude AI coaching:

1. Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. In `lib/coaching.ts`, replace `generateCoachingSummary` with a call to the Anthropic API using the `@anthropic-ai/sdk` package. The function signature and inputs are already structured for this.

---

## How the app works

- **Bankroll**: starts at $10,000 (fake money)
- **Bets**: commit to a goal (e.g. "go to gym 4x this week") and stake an amount
- **Check-ins**: tap "Check In" daily on each active bet
- **Settle**: at the end of the bet period, settle to win or lose the stake
- **Winning**: hit your target check-ins → bankroll goes up
- **Losing**: miss your target → bankroll goes down
- **Coach**: AI-generated summary on your dashboard based on your stats

---

## Project structure

```
app/
  (app)/              — authenticated pages
    page.tsx          — dashboard
    bets/new/         — create a bet
    bets/[id]/        — bet detail + check-in
    history/          — bankroll history
  auth/
    login/            — login + signup
    callback/         — Supabase OAuth callback
actions/              — server actions (bets, checkins, auth)
components/           — shared UI (Navigation, BetCard)
lib/
  supabase/           — Supabase client (browser + server)
  coaching.ts         — AI coaching logic
  types.ts            — TypeScript types
supabase/
  schema.sql          — run this in Supabase SQL Editor
```
