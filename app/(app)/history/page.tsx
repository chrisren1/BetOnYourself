import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BankrollHistory } from "@/lib/types";
import { TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("bankroll")
    .eq("id", user.id)
    .single();

  const { data: historyRaw } = await supabase
    .from("bankroll_history")
    .select("*, bets(title, emoji)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const history: BankrollHistory[] = historyRaw ?? [];

  const totalWon = history.filter((h) => h.change > 0).reduce((s, h) => s + h.change, 0);
  const totalLost = history.filter((h) => h.change < 0).reduce((s, h) => s + Math.abs(h.change), 0);
  const wins = history.filter((h) => h.change > 0).length;
  const losses = history.filter((h) => h.change < 0).length;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-20 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mt-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <h1 className="font-black text-2xl mt-4 mb-1">Bankroll History</h1>
      <p className="text-sm text-zinc-500 mb-6">Your complete betting record</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Current</div>
          <div className="text-xl font-black text-amber-400 bankroll-number">
            ${(profile?.bankroll ?? 10000).toLocaleString()}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs text-zinc-500 mb-1">W / L</div>
          <div className="text-xl font-black">
            <span className="text-green-400">{wins}</span>
            <span className="text-zinc-600">—</span>
            <span className="text-red-400">{losses}</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Net</div>
          <div className={`text-xl font-black bankroll-number ${
            totalWon - totalLost >= 0 ? "text-green-400" : "text-red-400"
          }`}>
            {totalWon - totalLost >= 0 ? "+" : ""}${(totalWon - totalLost).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Transaction list */}
      {history.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">📊</div>
          <div className="text-sm text-zinc-400">No bets settled yet. Your history will appear here.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  h.change > 0 ? "bg-green-500/15" : "bg-red-500/15"
                }`}>
                  {h.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium leading-tight">
                    {h.bets ? `${h.bets.emoji} ${h.bets.title}` : h.reason ?? "Adjustment"}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">{formatDate(h.created_at)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold bankroll-number ${h.change > 0 ? "text-green-400" : "text-red-400"}`}>
                  {h.change > 0 ? "+" : ""}${Math.abs(h.change).toLocaleString()}
                </div>
                <div className="text-xs text-zinc-600">${h.balance.toLocaleString()} balance</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
