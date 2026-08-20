"use client";

import { useState } from "react";
import { createWitnessLink } from "@/actions/witness";
import { Users, Copy, Check, CheckCircle, XCircle } from "lucide-react";

export default function WitnessShare({
  betId,
  witnessToken,
  witnessVerdict,
}: {
  betId: string;
  witnessToken: string | null;
  witnessVerdict: boolean | null;
}) {
  const [token, setToken] = useState(witnessToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function getLink() {
    setLoading(true);
    const result = await createWitnessLink(betId);
    setLoading(false);
    if (result.token) setToken(result.token);
  }

  async function copyLink() {
    if (!token) return;
    const url = `${window.location.origin}/witness/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-zinc-400" />
        <span className="text-sm font-medium">Witness</span>
      </div>
      <p className="text-xs text-zinc-500 mb-3">
        Share a link with a friend so they can confirm or deny this one — no account needed.
      </p>

      {witnessVerdict !== null && (
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-3 text-xs font-medium ${
            witnessVerdict
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {witnessVerdict ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          Witness said {witnessVerdict ? "yes" : "no"}
        </div>
      )}

      {token ? (
        <button
          type="button"
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy witness link"}
        </button>
      ) : (
        <button
          type="button"
          onClick={getLink}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Creating link…" : "Get a witness link"}
        </button>
      )}
    </div>
  );
}
