import { Bet, BankrollHistory } from "./types";

// Generates AI-style coaching summaries from bet data.
// To upgrade to real Claude AI: set ANTHROPIC_API_KEY in .env.local
// and replace generateCoachingSummary with an API call to claude-3-5-haiku.

type CoachingInput = {
  username: string | null;
  bankroll: number;
  activeBets: Bet[];
  recentHistory: BankrollHistory[];
  winRate: number; // 0–1
};

export function generateCoachingSummary(input: CoachingInput): string {
  const { username, bankroll, activeBets, recentHistory, winRate } = input;
  const name = username ?? "champ";
  const pct = Math.round(winRate * 100);
  const startingBankroll = 10000;
  const gain = bankroll - startingBankroll;
  const gainSign = gain >= 0 ? "+" : "";

  // Check-in completion on active bets. For "at_most" bets, staying low is
  // good, so the on-track score is inverted relative to raw check-in count.
  const activeSummaries = activeBets.map((b) => {
    const done = b.checkin_count ?? 0;
    const rawPct = Math.round((done / b.target_checkins) * 100);
    const onTrackPct = b.goal_type === "at_most" ? Math.max(0, 100 - rawPct) : rawPct;
    return { title: b.title, emoji: b.emoji, pctDone: onTrackPct, done, target: b.target_checkins };
  });

  const lagging = activeSummaries.filter((b) => b.pctDone < 50);
  const crushing = activeSummaries.filter((b) => b.pctDone >= 75);

  // Nothing settled yet — a "0% win rate" stat is just noise for a brand
  // new account. Welcome them and point at what they've already committed to.
  const hasSettledHistory = recentHistory.some((h) => h.change !== 0);
  if (!hasSettledHistory) {
    if (activeBets.length === 0) {
      return `Welcome, ${name}! You're starting with a $${startingBankroll.toLocaleString()} bankroll. Place your first bet on yourself — the only way to lose is to not show up.`;
    }

    const betList = activeSummaries.map((b) => `${b.emoji} ${b.title}`).join(" and ");
    const plural = activeBets.length === 1 ? "bet" : "bets";
    let msg = `Welcome, ${name}! You've got ${activeBets.length} ${plural} live — ${betList}. `;

    if (crushing.length > 0) {
      msg += `Off to a strong start on ${crushing.map((b) => `${b.emoji} ${b.title}`).join(" and ")}. `;
    }
    if (lagging.length > 0) {
      msg += `Keep an eye on ${lagging.map((b) => `${b.emoji} ${b.title}`).join(" and ")} — early days, so there's time to catch up. `;
    }
    msg += `Check in daily and prove it.`;

    return msg.trim();
  }

  let msg = "";

  if (pct >= 80) {
    msg += `You're on fire, ${name}. ${pct}% win rate — you're one of those rare people who actually does what they say they'll do. `;
  } else if (pct >= 60) {
    msg += `Solid work, ${name}. ${pct}% win rate puts you well above average. `;
  } else if (pct >= 40) {
    msg += `You're at ${pct}% — room to grow, ${name}. The data doesn't lie, but neither does the trend. `;
  } else {
    msg += `${pct}% win rate, ${name}. Rough patch — but you're showing up, which is more than most people do. `;
  }

  if (gain > 0) {
    msg += `Your bankroll is up ${gainSign}$${gain.toLocaleString()} from where you started. `;
  } else if (gain < 0) {
    msg += `You're down $${Math.abs(gain).toLocaleString()} from your starting bankroll — time to tighten up. `;
  }

  if (crushing.length > 0) {
    msg += `You're crushing ${crushing.map((b) => `${b.emoji} ${b.title}`).join(" and ")}. Keep that energy. `;
  }

  if (lagging.length > 0) {
    msg += `Watch out for ${lagging.map((b) => `${b.emoji} ${b.title}`).join(" and ")} — you're behind pace there. `;
  }

  if (activeBets.length === 0) {
    msg += `No active bets right now. Make a new commitment — the bankroll doesn't grow by sitting still.`;
  }

  return msg.trim();
}

export function getWinRate(history: BankrollHistory[]): number {
  const settled = history.filter((h) => h.change !== 0);
  if (settled.length === 0) return 0;
  const wins = settled.filter((h) => h.change > 0).length;
  return wins / settled.length;
}
