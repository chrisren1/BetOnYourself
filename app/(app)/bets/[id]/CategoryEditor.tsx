"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBetCategory } from "@/actions/bets";
import { BetCategory, CATEGORY_CONFIG } from "@/lib/types";
import { Pencil } from "lucide-react";

export default function CategoryEditor({
  betId,
  category,
  emoji,
}: {
  betId: string;
  category: BetCategory;
  emoji: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const cat = CATEGORY_CONFIG[category];

  async function pick(newCategory: BetCategory) {
    setOpen(false);
    if (newCategory === category) return;
    setSaving(true);
    await updateBetCategory(betId, newCategory, CATEGORY_CONFIG[newCategory].emoji);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className={`group w-14 h-14 rounded-2xl border flex items-center justify-center text-3xl ${cat.badge} disabled:opacity-50`}
        title="Change category"
      >
        {emoji}
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-2.5 h-2.5 text-zinc-300" />
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-16 left-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-xl grid grid-cols-3 gap-1.5 w-48">
            {(Object.entries(CATEGORY_CONFIG) as [BetCategory, typeof CATEGORY_CONFIG[BetCategory]][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => pick(key)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition-colors ${
                    key === category
                      ? `${cfg.badge} ${cfg.color}`
                      : "text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-lg">{cfg.emoji}</span>
                  {cfg.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
