import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BetCard from "@/components/BetCard";
import { Bet, BankrollHistory } from "@/lib/types";
import { generateCoachingSummary, getWinRate } from "@/lib/coaching";
import { Plus, Bot } from "lucide-react";

function daysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  // Active bets with check-in counts
  const { data: activeBetsRaw } = await supabase
    .from("bets")
    .select("*, checkins(count)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const activeBets: Bet[] = (activeBetsRaw ?? []).map((b: Record<string, unknown>) => ({
    ...(b as Bet),
    checkin_count: (b.checkins as { count: number }[])?.[0]?.count ?? 0,
  }));

  // Recent settled
  const { data: settledRaw } = await supabase
    .from("bets")
    .select("*, checkins(count)")
    .eq("user_id", user.id)
    .in("status", ["won", "lost"])
    .order("created_at", { ascending: false })
    .limit(5);

  const settledBets: Bet[] = (settledRaw ?? []).map((b: Record<string, unknown>) => ({
    ...(b as Bet),
    checkin_count: (b.checkins as { count: number }[])?.[0]?.count ?? 0,
  }));

  // Bankroll history
  const { data: historyRaw } = await supabase
    .from("bankroll_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const history: BankrollHistory[] = historyRaw ?? [];
  const winRate = getWinRate(history);

  const gain = profile.bankroll - 10000;
  const totalStaked = activeBets.reduce((sum: number, b: Bet) => sum + b.stake, 0);
  const nearestDeadline = activeBets.length > 0
    ? Math.min(...activeBets.map((b) => daysLeft(b.end_date)))
    : null;

  const coachingMessage = generateCoachingSummary({
    username: profile.username,
    bankroll: profile.bankroll,
    activeBets,
    recentHistory: history,
    winRate,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-20 pb-24">
      {/* Bankroll hero */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl p-6 mb-6">
        <div className="text-xs text-zinc-500 font-medium uppercase tracking-widest mb-1.5">
          Bankroll
        </div>
        <div className="text-2xl font-bold bankroll-number text-zinc-300 mb-5">
          ${profile.bankroll.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </div>

        {totalStaked > 0 ? (
          <>
            <div className="text-xs text-amber-500 font-semibold uppercase tracking-widest mb-1.5">
              On The Line
            </div>
            <div className="text-5xl font-black bankroll-number text-amber-400 mb-2">
              ${totalStaked.toLocaleString()}
            </div>
            <div className="text-sm text-zinc-400">
              {activeBets.length} active {activeBets.length === 1 ? "bet" : "bets"}
              {nearestDeadline !== null && ` · ${nearestDeadline}d remaining`}
            </div>
          </>
        ) : (
          <div className="text-sm text-zinc-500">Nothing on the line right now.</div>
        )}

        <div className="flex items-center gap-4 flex-wrap mt-5 pt-4 border-t border-zinc-800/70">
          <span className="text-xs text-zinc-500">{Math.round(winRate * 100)}% promise rate</span>
          <div className="w-px h-3 bg-zinc-700" />
          <span className={`text-xs ${gain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {gain >= 0 ? "+" : ""}${gain.toLocaleString()} lifetime
          </span>
        </div>
      </div>

      {/* AI Coach */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-amber-400 font-semibold mb-1.5">Coach</div>
            <p className="text-sm text-zinc-300 leading-relaxed">{coachingMessage}</p>
          </div>
        </div>
      </div>

      {/* Active Bets */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Active Bets</h2>
          <Link href="/bets/new" className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" />New bet
          </Link>
        </div>

        {activeBets.length === 0 ? (
          <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-sm font-semibold text-zinc-300 mb-1">No active bets</div>
            <div className="text-xs text-zinc-500 mb-5">Make a commitment. Put your bankroll on the line.</div>
            <Link href="/bets/new" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
              <Plus className="w-4 h-4" />Place your first bet
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBets.map((bet) => <BetCard key={bet.id} bet={bet} />)}
          </div>
        )}
      </div>

      {/* Recent results */}
      {settledBets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">Recent Results</h2>
            <Link href="/history" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              Full history →
            </Link>
          </div>
          <div className="space-y-3">
            {settledBets.map((bet) => <BetCard key={bet.id} bet={bet} />)}
          </div>
        </div>
      )}
    </div>
  );
}
