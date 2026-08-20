"use client";

import { useState } from "react";
import { submitWitnessVerdict } from "@/actions/witness";
import { GoalType } from "@/lib/types";
import { CheckCircle, XCircle } from "lucide-react";

export default function WitnessVerdictButtons({
  token,
  title,
  goalType,
  targetCheckins,
  existingVerdict,
}: {
  token: string;
  title: string;
  goalType: GoalType;
  targetCheckins: number;
  existingVerdict: boolean | null;
}) {
  const [verdict, setVerdict] = useState<boolean | null>(existingVerdict);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAtMost = goalType === "at_most";
  const question = isAtMost
    ? `Did they stay at or under ${targetCheckins} today?`
    : "Did they do it today?";

  async function vote(success: boolean) {
    setLoading(true);
    setError(null);
    const result = await submitWitnessVerdict(token, success);
    setLoading(false);
    if (result.error) {
      setError(result.error === "already_settled" ? "This bet was just settled — too late to vote." : result.error);
      return;
    }
    setVerdict(success);
  }

  if (verdict !== null) {
    return (
      <div
        className={`rounded-xl px-4 py-4 text-center border ${
          verdict
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-red-500/10 border-red-500/30"
        }`}
      >
        {verdict ? (
          <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
        ) : (
          <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
        )}
        <div className="text-sm font-semibold">
          Recorded — you said {verdict ? "yes" : "no"} on &ldquo;{title}&rdquo;
        </div>
        <button
          type="button"
          onClick={() => setVerdict(null)}
          className="text-xs text-zinc-500 hover:text-zinc-300 mt-2 underline"
        >
          Change my answer
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-zinc-300 font-medium mb-3 text-center">{question}</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => vote(true)}
          className="flex flex-col items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border-2 border-emerald-500/40 rounded-xl py-4 font-bold text-emerald-400 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-5 h-5" />
          Yes
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => vote(false)}
          className="flex flex-col items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 border-2 border-red-500/40 rounded-xl py-4 font-bold text-red-400 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-5 h-5" />
          No
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-3 text-center">{error}</p>}
    </div>
  );
}
