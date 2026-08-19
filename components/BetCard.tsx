"use client";

import Link from "next/link";
import { Bet } from "@/lib/types";
import { CheckCircle, Clock, ChevronRight } from "lucide-react";

function daysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function BetCard({ bet }: { bet: Bet }) {
  const checkinCount = bet.checkin_count ?? 0;
  const progress = Math.min(checkinCount / bet.target_checkins, 1);
  const progressPct = Math.round(progress * 100);
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

  return (
    <Link href={`/bets/${bet.id}`}>
      <div className={`bet-card bg-zinc-900 border ${statusColors[bet.status]} rounded-2xl p-4 cursor-pointer`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{bet.emoji}</span>
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
                  ? "bg-green-500"
                  : bet.status === "lost"
                  ? "bg-red-500"
                  : progressPct >= 75
                  ? "bg-green-500"
                  : progressPct >= 40
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
            <span>{checkinCount}/{bet.target_checkins} check-ins</span>
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
