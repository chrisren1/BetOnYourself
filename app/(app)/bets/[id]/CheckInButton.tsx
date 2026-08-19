"use client";

import { useState } from "react";
import { createCheckin, undoCheckin } from "@/actions/checkins";
import { CheckCircle, Circle } from "lucide-react";
import { GoalType } from "@/lib/types";

export default function CheckInButton({
  betId,
  checkedInToday,
  goalType,
}: {
  betId: string;
  checkedInToday: boolean;
  goalType: GoalType;
}) {
  const [checked, setChecked] = useState(checkedInToday);
  const [loading, setLoading] = useState(false);
  const isAtMost = goalType === "at_most";

  async function toggle() {
    setLoading(true);
    if (checked) {
      await undoCheckin(betId);
      setChecked(false);
    } else {
      await createCheckin(betId);
      setChecked(true);
    }
    setLoading(false);
  }

  // For "at_most" bets, logging a check-in means you did the thing you're
  // limiting — so the checked state is the warning color, not the success one.
  const checkedClass = isAtMost
    ? "bg-red-500/15 border-2 border-red-500 text-red-400 hover:bg-red-500/20"
    : "bg-green-500/15 border-2 border-green-500 text-green-400 hover:bg-green-500/20";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all ${
        checked ? checkedClass : "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-2 border-transparent"
      } disabled:opacity-50`}
    >
      {loading ? (
        <span>...</span>
      ) : checked ? (
        <>
          <CheckCircle className="w-5 h-5" />
          {isAtMost ? "Logged for today — tap to undo" : "Checked in today — tap to undo"}
        </>
      ) : (
        <>
          <Circle className="w-5 h-5" />
          {isAtMost ? "Log Today (did the thing)" : "Check In for Today"}
        </>
      )}
    </button>
  );
}
