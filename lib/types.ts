export type Profile = {
  id: string;
  username: string | null;
  bankroll: number;
  created_at: string;
};

export type BetCategory = "fitness" | "sleep" | "food" | "work" | "social" | "other";
export type BetStatus = "active" | "won" | "lost";

export type Bet = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: BetCategory;
  emoji: string;
  stake: number;
  target_checkins: number;
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
  { label: string; emoji: string; color: string }
> = {
  fitness:  { label: "Fitness",  emoji: "🏋️", color: "text-blue-400"   },
  sleep:    { label: "Sleep",    emoji: "😴", color: "text-purple-400" },
  food:     { label: "Food",     emoji: "🍳", color: "text-orange-400" },
  work:     { label: "Work",     emoji: "💻", color: "text-cyan-400"   },
  social:   { label: "Social",   emoji: "🍺", color: "text-pink-400"   },
  other:    { label: "Other",    emoji: "🎯", color: "text-zinc-400"   },
};
