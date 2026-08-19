export type Profile = {
  id: string;
  username: string | null;
  bankroll: number;
  created_at: string;
};

export type BetCategory = "fitness" | "sleep" | "food" | "work" | "social" | "other";
export type BetStatus = "active" | "won" | "lost";

// at_least = hit a threshold (e.g. gym 4x+ this week)
// at_most  = stay under a threshold (e.g. drink 2x or less this week)
export type GoalType = "at_least" | "at_most";

export type Bet = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: BetCategory;
  emoji: string;
  stake: number;
  target_checkins: number;
  goal_type: GoalType;
  start_date: string;
  end_date: string;
  status: BetStatus;
  created_at: string;
  // joined
  checkins?: Checkin[];
  checkin_count?: number;
};

export type Checkin = {
  id: string;
  bet_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  note: string | null;
  created_at: string;
};

export type BankrollHistory = {
  id: string;
  user_id: string;
  change: number;
  balance: number;
  reason: string | null;
  bet_id: string | null;
  created_at: string;
  // joined
  bets?: { title: string; emoji: string } | null;
};

export const CATEGORY_CONFIG: Record<
  BetCategory,
  { label: string; emoji: string; color: string; badge: string; ring: string }
> = {
  fitness:  { label: "Fitness",  emoji: "🏋️", color: "text-blue-400",   badge: "bg-blue-500/15 border-blue-500/30",     ring: "border-blue-500"   },
  sleep:    { label: "Sleep",    emoji: "😴", color: "text-purple-400", badge: "bg-purple-500/15 border-purple-500/30", ring: "border-purple-500" },
  food:     { label: "Food",     emoji: "🍳", color: "text-orange-400", badge: "bg-orange-500/15 border-orange-500/30", ring: "border-orange-500" },
  work:     { label: "Work",     emoji: "💻", color: "text-cyan-400",   badge: "bg-cyan-500/15 border-cyan-500/30",     ring: "border-cyan-500"   },
  social:   { label: "Social",   emoji: "🍺", color: "text-pink-400",   badge: "bg-pink-500/15 border-pink-500/30",     ring: "border-pink-500"   },
  other:    { label: "Other",    emoji: "🎯", color: "text-zinc-400",   badge: "bg-zinc-500/15 border-zinc-500/30",     ring: "border-zinc-500"   },
};
