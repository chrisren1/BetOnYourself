import { Bet, BankrollHistory, BetCategory } from "./types";

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

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Judges progress against how much of the bet's window has actually
// elapsed, not raw checkin_count/target_checkins. A bet that's 1/4 done
// on day 1 of 7 is ahead of pace, not behind — you can't check in for
// days that haven't happened yet.
function computeBetPace(b: Bet): { crushing: boolean; lagging: boolean } {
  const done = b.checkin_count ?? 0;
  const target = b.target_checkins;
  const totalDays = Math.max(1, Math.round((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / MS_PER_DAY) + 1);
  const elapsedDays = Math.min(
    totalDays,
    Math.max(1, Math.round((new Date().getTime() - new Date(b.start_date).getTime()) / MS_PER_DAY) + 1)
  );
  const expectedByNow = (target * elapsedDays) / totalDays;

  if (b.goal_type === "at_most") {
    const overLimit = done > target;
    const lagging = overLimit || done > expectedByNow * 1.2;
    const crushing = !lagging && (done === 0 || done <= expectedByNow * 0.5);
    return { crushing, lagging };
  }

  const hitTarget = done >= target;
  const crushing = hitTarget || done >= expectedByNow * 1.5;
  const lagging = !hitTarget && done < expectedByNow * 0.5;
  return { crushing, lagging };
}

export function generateCoachingSummary(input: CoachingInput): string {
  const { username, bankroll, activeBets, recentHistory, winRate } = input;
  const name = username ?? "champ";
  const pct = Math.round(winRate * 100);
  const startingBankroll = 10000;
  const gain = bankroll - startingBankroll;
  const gainSign = gain >= 0 ? "+" : "";

  const activeSummaries = activeBets.map((b) => ({
    title: b.title,
    emoji: b.emoji,
    ...computeBetPace(b),
  }));

  const lagging = activeSummaries.filter((b) => b.lagging);
  const crushing = activeSummaries.filter((b) => b.crushing);

  // Nothing settled yet — a "0% promise rate" stat is just noise for a brand
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
    msg += `You're on fire, ${name}. ${pct}% promise rate — you're one of those rare people who actually does what they say they'll do. `;
  } else if (pct >= 60) {
    msg += `Solid work, ${name}. ${pct}% promise rate puts you well above average. `;
  } else if (pct >= 40) {
    msg += `You're at ${pct}% — room to grow, ${name}. The data doesn't lie, but neither does the trend. `;
  } else {
    msg += `${pct}% promise rate, ${name}. Rough patch — but you're showing up, which is more than most people do. `;
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

// "positive" = things are trending well right now (on pace, just checked
// in, staying under a limit). "corrective" = behind pace, over a limit, or
// settled as a loss — still supportive, but pointed at what's next.
const CATEGORY_INSIGHT: Record<BetCategory, { positive: string; corrective: string }> = {
  fitness: {
    positive: "Consistent training compounds — better sleep, sharper mood, more energy carrying into everything else you do this week.",
    corrective: "Missed sessions are normal, but momentum is the whole game with fitness. One rep today beats a perfect plan you never start.",
  },
  sleep: {
    positive: "Good sleep isn't just rest — it's when your body actually recovers and your brain consolidates the day. This is compounding in your favor.",
    corrective: "Sleep debt stacks fast and doesn't forgive easily. Tonight's a good night to protect the window you promised yourself.",
  },
  food: {
    positive: "Cooking at home means you control what's actually going into your body — that adds up in ways the scale won't show for weeks.",
    corrective: "Every home-cooked meal from here still counts. The target doesn't care about the meals you've already missed, only what's next.",
  },
  work: {
    positive: "Deep work sessions compound into real output. This is the difference between people who plan and people who ship.",
    corrective: "Focus is a muscle — it's harder to start after a gap, but that's exactly when showing up matters most.",
  },
  social: {
    positive: "Fewer nights drinking means better sleep, sharper mornings, and a bankroll that isn't quietly leaking cash at the bar.",
    corrective: "One night off-plan doesn't erase the bet — it just raises the stakes on the nights that are left.",
  },
  other: {
    positive: "Consistency on small commitments is what builds trust with yourself. That trust is the actual prize here, not just the stake.",
    corrective: "Progress isn't linear. What matters is what you do with the days you've got left.",
  },
};

type BetCoachInput = {
  bet: Pick<Bet, "title" | "category" | "goal_type" | "target_checkins" | "stake" | "status">;
  checkinCount: number;
  checkedInToday: boolean;
  overLimit: boolean;
  isPastEndDate: boolean;
};

export function generateBetCoachMessage(input: BetCoachInput): string {
  const { bet, checkinCount, checkedInToday, overLimit, isPastEndDate } = input;
  const isAtMost = bet.goal_type === "at_most";
  const insight = CATEGORY_INSIGHT[bet.category] ?? CATEGORY_INSIGHT.other;
  const remaining = Math.max(bet.target_checkins - checkinCount, 0);

  if (bet.status === "won") {
    return `You hit it — "${bet.title}" is a win. ${insight.positive} That's +$${bet.stake.toLocaleString()} in the bank because you followed through.`;
  }

  if (bet.status === "lost") {
    return `This one didn't land. ${insight.corrective} The stake's gone, but the next bet is a clean slate — what matters is you keep betting on yourself.`;
  }

  if (isAtMost) {
    if (overLimit) {
      return `You've gone over the limit on "${bet.title}" — this one's headed for a loss. ${insight.corrective}`;
    }
    if (checkedInToday) {
      return `Logged for today — that's ${checkinCount}/${bet.target_checkins} used, so the margin's tighter now. ${insight.corrective}`;
    }
    return `Clean so far — ${checkinCount}/${bet.target_checkins} used on "${bet.title}". ${insight.positive}`;
  }

  if (checkedInToday) {
    return `Checked in — ${checkinCount}/${bet.target_checkins} on "${bet.title}". ${insight.positive}`;
  }
  if (checkinCount >= bet.target_checkins) {
    return `Target already hit at ${checkinCount}/${bet.target_checkins}. ${insight.positive} Settle it whenever you're ready to lock in the win.`;
  }
  if (isPastEndDate) {
    return `Time's up on this one. ${insight.corrective}`;
  }
  return `${remaining} more to go on "${bet.title}". ${insight.corrective}`;
}
