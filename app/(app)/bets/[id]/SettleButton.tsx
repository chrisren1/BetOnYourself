"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { settleBet } from "@/actions/bets";
import { Gavel } from "lucide-react";

export default function SettleButton({
  betId,
  canSettle,
  checkinCount,
  targetCheckins,
}: {
  betId: string;
  canSettle: boolean;
  checkinCount: number;
  targetCheckins: number;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSettle() {
    if (!confirm("Settle this bet now? This is final.")) return;
    setLoading(true);
    const result = await settleBet(betId);
    setLoading(false);
    if (result.success) {
      router.refresh();
    }
  }

  if (!canSettle) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-500 text-center">
        Bet settles when it ends or you hit {targetCheckins} check-ins ({checkinCount}/{targetCheckins} so far)
      </div>
    );
  }

  return (
    <button
      onClick={handleSettle}
      disabled={loading}
      className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
    >
      <Gavel className="w-4 h-4" />
      {loading ? "Settling..." : "Settle Bet"}
    </button>
  );
}
