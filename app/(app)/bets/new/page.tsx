"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createBet } from "@/actions/bets";
import { suggestCategory } from "@/actions/ai";
import { BetCategory, GoalType, CATEGORY_CONFIG } from "@/lib/types";

const QUICK_BETS = [
  { title: "Go to the gym", category: "fitness" as BetCategory, emoji: "🏋️", target: 4, duration: 7, goalType: "at_least" as GoalType },
  { title: "Get 7+ hours of sleep", category: "sleep" as BetCategory, emoji: "😴", target: 5, duration: 7, goalType: "at_least" as GoalType },
  { title: "Cook at home", category: "food" as BetCategory, emoji: "🍳", target: 4, duration: 7, goalType: "at_least" as GoalType },
  { title: "Deep work sessions", category: "work" as BetCategory, emoji: "💻", target: 5, duration: 7, goalType: "at_least" as GoalType },
  { title: "No drinking", category: "social" as BetCategory, emoji: "🚫🍺", target: 7, duration: 7, goalType: "at_least" as GoalType },
  { title: "Limit drinking", category: "social" as BetCategory, emoji: "🍺", target: 2, duration: 7, goalType: "at_most" as GoalType },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysUntilEndOfWeek(): number {
  const day = new Date().getDay(); // 0 = Sunday .. 6 = Saturday
  return day === 0 ? 7 : 7 - day;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
}

const DURATION_PRESETS = [
  { label: "Today", days: 0 },
  { label: "3 days", days: 3 },
  { label: "End of week", days: daysUntilEndOfWeek() },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
];

export default function NewBetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BetCategory>("fitness");
  const [emoji, setEmoji] = useState("🏋️");
  const [stake, setStake] = useState(300);
  const [targetCheckins, setTargetCheckins] = useState(4);
  const [duration, setDuration] = useState(7);
  const [goalType, setGoalType] = useState<GoalType>("at_least");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [detectingCategory, setDetectingCategory] = useState(false);

  // Auto-detect category from the title via Claude, unless the user has
  // already picked one manually — never override a deliberate choice.
  useEffect(() => {
    if (categoryTouched || title.trim().length < 3) return;
    const handle = setTimeout(async () => {
      setDetectingCategory(true);
      const suggested = await suggestCategory(title);
      setDetectingCategory(false);
      if (suggested && !categoryTouched) {
        setCategory(suggested);
        setEmoji(CATEGORY_CONFIG[suggested].emoji);
      }
    }, 700);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // Check-ins are capped at one per day, so the target can never exceed the
  // number of days in the bet — otherwise it'd be mathematically unwinnable
  // (e.g. a same-day bet with a target of 4 check-ins).
  function applyDuration(days: number) {
    setDuration(days);
    setTargetCheckins((prev) => Math.max(1, Math.min(prev, days + 1)));
  }

  function applyQuickBet(qb: typeof QUICK_BETS[0]) {
    setTitle(qb.title);
    setCategory(qb.category);
    setCategoryTouched(true);
    setEmoji(qb.emoji);
    setTargetCheckins(qb.target);
    setDuration(qb.duration);
    setGoalType(qb.goalType);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");
    setLoading(true);
    setError(null);

    const result = await createBet({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      emoji,
      stake,
      target_checkins: targetCheckins,
      goal_type: goalType,
      end_date: addDays(duration),
    });

    setLoading(false);
    if (result.error) return setError(result.error);
    router.push("/");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-20 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mt-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <h1 className="font-black text-2xl mb-1 mt-4">Place a Bet</h1>
      <p className="text-sm text-zinc-500 mb-6">Make a commitment. Put your bankroll on it.</p>

      {/* Quick-pick templates */}
      <div className="mb-6">
        <div className="text-xs text-zinc-500 font-medium uppercase tracking-widest mb-3">Quick Pick</div>
        <div className="flex gap-2 flex-wrap">
          {QUICK_BETS.map((qb) => (
            <button
              key={qb.title}
              onClick={() => applyQuickBet(qb)}
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <span>{qb.emoji}</span>
              <span>{qb.title}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div>
          <label className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mb-2">
            Category
            {detectingCategory && (
              <span className="flex items-center gap-1 text-amber-500/80 normal-case font-normal">
                <Sparkles className="w-3 h-3 animate-pulse" />
                detecting from title…
              </span>
            )}
          </label>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(CATEGORY_CONFIG) as [BetCategory, typeof CATEGORY_CONFIG[BetCategory]][]).map(([cat, cfg]) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); setEmoji(cfg.emoji); setCategoryTouched(true); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  category === cat
                    ? `${cfg.badge} ${cfg.color}`
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs text-zinc-400 font-medium mb-1.5">What&apos;s the bet?</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`e.g. "${QUICK_BETS[0].title}"`}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 outline-none transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-zinc-400 font-medium mb-1.5">Details (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. At least 45 min sessions"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 outline-none transition-colors"
          />
        </div>

        {/* Goal type */}
        <div>
          <label className="block text-xs text-zinc-400 font-medium mb-2">Goal type</label>
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {(
              [
                { value: "at_least" as GoalType, label: "Hit a target", hint: "e.g. gym 4x+" },
                { value: "at_most" as GoalType, label: "Stay under a limit", hint: "e.g. drink ≤2x" },
              ]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGoalType(opt.value)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  goalType === opt.value
                    ? opt.value === "at_most"
                      ? "bg-orange-500/15 text-orange-400"
                      : "bg-emerald-500/15 text-emerald-400"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target check-ins + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 font-medium mb-1.5">
              {goalType === "at_most" ? "Max allowed" : "Target check-ins"}
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={targetCheckins}
              onChange={(e) => setTargetCheckins(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
            <div className="text-xs text-zinc-600 mt-1">
              {goalType === "at_most" ? "the most times you can do it" : "times you need to do it"}
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 font-medium mb-1.5">Duration (days)</label>
            <input
              type="number"
              min={0}
              max={365}
              value={duration}
              onChange={(e) => applyDuration(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
            <div className="flex gap-1.5 flex-wrap mt-2">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyDuration(p.days)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    duration === p.days
                      ? "bg-zinc-800 border-amber-500 text-amber-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-zinc-600 mt-1.5">ends {formatShortDate(addDays(duration))}</div>
          </div>
        </div>

        {/* Stake */}
        <div>
          <label className="block text-xs text-zinc-400 font-medium mb-2">
            Stake — <span className="text-amber-400">${stake.toLocaleString()}</span>
          </label>
          <input
            type="range"
            min={50}
            max={2000}
            step={50}
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-zinc-600 mt-1">
            <span>$50</span>
            <span>$2,000</span>
          </div>
        </div>

        {/* Preview card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs text-zinc-500 mb-3">Bet preview</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <div>
                <div className="font-semibold text-sm">{title || "Your bet"}</div>
                <div className="text-xs text-zinc-500">
                  {goalType === "at_most" ? `${targetCheckins}x or less` : `${targetCheckins}x+`}{" "}
                  {duration === 0 ? "today" : `in ${duration} day${duration === 1 ? "" : "s"}`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-lg text-amber-400 bankroll-number">${stake.toLocaleString()}</div>
              <div className="text-xs text-zinc-600">at stake</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black py-4 rounded-2xl transition-colors text-base"
        >
          {loading ? "Placing bet..." : `Bet $${stake.toLocaleString()} on yourself`}
        </button>
      </form>
    </div>
  );
}
