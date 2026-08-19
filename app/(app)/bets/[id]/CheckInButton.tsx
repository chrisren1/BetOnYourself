"use client";

import { useState } from "react";
import { createCheckin, undoCheckin } from "@/actions/checkins";
import { CheckCircle, Circle } from "lucide-react";

export default function CheckInButton({
  betId,
  checkedInToday,
}: {
  betId: string;
  checkedInToday: boolean;
}) {
  const [checked, setChecked] = useState(checkedInToday);
  const [loading, setLoading] = useState(false);

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

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all ${
        checked
          ? "bg-green-500/15 border-2 border-green-500 text-green-400 hover:bg-green-500/20"
          : "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-2 border-transparent"
      } disabled:opacity-50`}
    >
      {loading ? (
        <span>...</span>
      ) : checked ? (
        <>
          <CheckCircle className="w-5 h-5" />
          Checked in today — tap to undo
        </>
      ) : (
        <>
          <Circle className="w-5 h-5" />
          Check In for Today
        </>
      )}
    </button>
  );
}
