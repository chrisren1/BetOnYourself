import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckInButton from "./CheckInButton";
import SettleButton from "./SettleButton";
import { CheckCircle, Circle, Calendar, Target, Trophy, XCircle } from "lucide-react";
import { Bet, Checkin } from "@/lib/types";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const endD = new Date(end);
  while (cur <= endD) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export default async function BetDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: bet } = await supabase
    .from("bets")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!bet) notFound();

  const { data: checkinsRaw } = await supabase
    .from("checkins")
    .select("*")
    .eq("bet_id", params.id)
    .order("date", { ascending: true });

  const checkins: Checkin[] = checkinsRaw ?? [];
  const checkinDates = new Set(checkins.filter((c) => c.completed).map((c) => c.date));
  const checkinCount = checkinDates.size;
  const progress = Math.min(checkinCount / bet.target_checkins, 1);
  const progressPct = Math.round(progress * 100);

  const today = new Date().toISOString().split("T")[0];
  const checkedInToday = checkinDates.has(today);
  const isActive = bet.status === "active";
  const isPastEndDate = today > bet.end_date;

  const allDates = getDatesInRange(bet.start_date, bet.end_date);
  const futureDates = allDates.filter((d) => d > today);
  const pastAndToday = allDates.filter((d) => d <= today);

  const statusConfig = {
    active: { color: "text-amber-400", label: "Active" },
    won: { color: "text-green-400", label: "Won" },
    lost: { color: "text-red-400", label: "Lost" },
  };

  const sc = statusConfig[bet.status as keyof typeof statusConfig];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-20 pb-24">
      {/* Header */}
      <div className="mt-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{bet.emoji}</span>
            <div>
              <h1 className="font-black text-xl leading-tight">{bet.title}</h1>
              {bet.description && (
                <p className="text-sm text-zinc-400 mt-1">{bet.description}</p>
              )}
              <div className={`text-xs font-semibold mt-1 ${sc.color}`}>{sc.label}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-amber-400 bankroll-number">${(bet as Bet).stake.toLocaleString()}</div>
            <div className="text-xs text-zinc-600">at stake</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium">Progress</span>
          </div>
          <span className="text-sm font-bold text-amber-400">{checkinCount}/{(bet as Bet).target_checkins}</span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all ${
              bet.status === "won" ? "bg-green-500" :
              bet.status === "lost" ? "bg-red-500" :
              progressPct >= 75 ? "bg-green-500" :
              progressPct >= 40 ? "bg-amber-500" : "bg-zinc-600"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(bet.start_date)} → {formatDate(bet.end_date)}</span>
          </div>
          <span>{progressPct}% complete</span>
        </div>
      </div>

      {/* Check-in button (active bets only) */}
      {isActive && !isPastEndDate && (
        <div className="mb-5">
          <CheckInButton betId={params.id} checkedInToday={checkedInToday} />
        </div>
      )}

      {/* Settle button (active + past end date) */}
      {isActive && (
        <div className="mb-5">
          <SettleButton
            betId={params.id}
            canSettle={isPastEndDate || checkinCount >= (bet as Bet).target_checkins}
            checkinCount={checkinCount}
            targetCheckins={(bet as Bet).target_checkins}
          />
        </div>
      )}

      {/* Won / Lost result card */}
      {(bet.status === "won" || bet.status === "lost") && (
        <div className={`rounded-2xl p-5 mb-5 border ${
          bet.status === "won"
            ? "bg-green-500/10 border-green-500/30"
            : "bg-red-500/10 border-red-500/30"
        }`}>
          <div className="flex items-center gap-3">
            {bet.status === "won" ? (
              <Trophy className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <div>
              <div className={`font-bold ${bet.status === "won" ? "text-green-400" : "text-red-400"}`}>
                {bet.status === "won" ? `You won $${(bet as Bet).stake.toLocaleString()}!` : `You lost $${(bet as Bet).stake.toLocaleString()}`}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {checkinCount}/{(bet as Bet).target_checkins} check-ins completed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar view */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="text-xs text-zinc-500 font-medium uppercase tracking-widest mb-4">Check-in Log</div>
        <div className="grid grid-cols-7 gap-1.5">
          {pastAndToday.map((date) => {
            const done = checkinDates.has(date);
            const isToday = date === today;
            return (
              <div
                key={date}
                title={date}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs relative ${
                  done
                    ? "bg-green-500/20 border border-green-500/30"
                    : isToday
                    ? "bg-zinc-800 border border-amber-500/50"
                    : "bg-zinc-800/50 border border-zinc-800"
                }`}
              >
                {done ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : isToday ? (
                  <Circle className="w-4 h-4 text-amber-500" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-zinc-700" />
                )}
              </div>
            );
          })}
          {futureDates.map((date) => (
            <div
              key={date}
              className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800/50 flex items-center justify-center"
            >
              <Circle className="w-3 h-3 text-zinc-800" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
            <span>Checked in</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-zinc-800 border border-amber-500/50" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-800" />
            <span>Missed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
