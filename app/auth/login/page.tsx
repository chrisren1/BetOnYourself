"use client";

import { useState } from "react";
import { signIn, signUp } from "@/actions/auth";
import { TrendingUp } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = mode === "login" ? await signIn(formData) : await signUp(formData);

    setLoading(false);
    if (result?.error) setError(result.error);
    if (result && "message" in result && result.message) setMessage(result.message);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-zinc-950" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">Bet On Yourself</div>
            <div className="text-xs text-zinc-500">Your bankroll. Your promises.</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          {/* Tab switcher */}
          <div className="flex bg-zinc-800 rounded-xl p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setMessage(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm
                           placeholder:text-zinc-600 focus:outline-none focus:border-amber-500
                           focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm
                           placeholder:text-zinc-600 focus:outline-none focus:border-amber-500
                           focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-400">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                         text-zinc-950 font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading
                ? "..."
                : mode === "login"
                ? "Log In"
                : "Create Account — Start with $10,000"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Your bankroll starts at $10,000. Don&apos;t blow it.
        </p>
      </div>
    </div>
  );
}
