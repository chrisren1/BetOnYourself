"use client";

import Link from "next/link";
import { Bet, CATEGORY_CONFIG } from "@/lib/types";
import { CheckCircle, Clock, ChevronRight } from "lucide-react";

function daysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function BetCard({ bet }: { bet: Bet }) {
  const checkinCount = bet.checkin_count ?? 0;
  const isAtMost = bet.goal_type === "at_most";
  const progress = Math.min(checkinCount / bet.target_checkins, 1);
  const progressPct = Math.round(progress * 100);
  const overLimit = isAtMost && checkinCount > bet.target_checkins;
  const remaining = daysLeft(bet.end_date);
  const isActive = bet.status === "active";

  const statusColors = {
    active: "border-zinc-800",
    won: "border-green-500/40",
    lost: "border-red-500/40",
  };

  const stakeColors = {
    active: "text-amber-400",
    won: "text-green-400",
    lost: "text-red-400",
  };

  const badgeConfig = {
    active: null,
    won: { label: "WON", class: "bg-green-500/15 text-green-400 border-green-500/20" },
    lost: { label: "LOST", class: "bg-red-500/15 text-red-400 border-red-500/20" },
  };

  const badge = badgeConfig[bet.status];
  const cat = CATEGORY_CONFIG[bet.category];

  return (
    <Link href={`/bets/${bet.id}`}>
      <div className={`bet-card bg-zinc-900 border ${statusColors[bet.status]} rounded-2xl p-4 cursor-pointer`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <span className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center text-lg ${cat.badge}`}>
              {bet.emoji}
            </span>
            <div>
              <div className="font-semibold text-sm text-zinc-100 leading-tight">{bet.title}</div>
              {bet.description && (
                <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{bet.description}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {badge && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge.class}`}>
                {badge.label}
              </span>
            )}
            <div className="text-right">
              <div className={`font-bold text-base bankroll-number ${stakeColors[bet.status]}`}>
                {bet.status === "won" ? "+" : bet.status === "lost" ? "-" : ""}${bet.stake.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-600">stake</div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                bet.status === "won"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : bet.status === "lost"
                  ? "bg-gradient-to-r from-red-600 to-red-500"
                  : isAtMost
                  ? overLimit
                    ? "bg-gradient-to-r from-red-600 to-red-500"
                    : progressPct >= 60
                    ? "bg-gradient-to-r from-orange-600 to-orange-500"
                    : "bg-gradient-to-r from-orange-500 to-orange-400"
                  : progressPct >= 75
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : progressPct > 0
                  ? "bg-amber-500"
                  : "bg-zinc-600"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{checkinCount}/{bet.target_checkins}{isAtMost ? " max" : " check-ins"}</span>
          </div>
          {isActive ? (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{remaining}d left</span>
            </div>
          ) : (
            <div className="text-xs text-zinc-600">Settled</div>
          )}
        </div>
      </div>
    </Link>
  );
}
