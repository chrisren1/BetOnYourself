"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BetCategory } from "@/lib/types";

export type CreateBetInput = {
  title: string;
  description?: string;
  category: BetCategory;
  emoji: string;
  stake: number;
  target_checkins: number;
  end_date: string;
};

export async function createBet(input: CreateBetInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("bets").insert({
    user_id: user.id,
    title: input.title,
    description: input.description || null,
    category: input.category,
    emoji: input.emoji,
    stake: input.stake,
    target_checkins: input.target_checkins,
    end_date: input.end_date,
    start_date: new Date().toISOString().split("T")[0],
    status: "active",
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function settleBet(betId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Load bet
  const { data: bet } = await supabase
    .from("bets")
    .select("*, checkins(count)")
    .eq("id", betId)
    .eq("user_id", user.id)
    .single();

  if (!bet) return { error: "Bet not found" };
  if (bet.status !== "active") return { error: "Bet already settled" };

  // Count completed check-ins
  const { count } = await supabase
    .from("checkins")
    .select("*", { count: "exact", head: true })
    .eq("bet_id", betId)
    .eq("completed", true);

  const checkinCount = count ?? 0;
  const won = checkinCount >= bet.target_checkins;
  const newStatus = won ? "won" : "lost";
  const bankrollChange = won ? bet.stake : -bet.stake;

  // Get current bankroll
  const { data: profile } = await supabase
    .from("profiles")
    .select("bankroll")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const newBankroll = profile.bankroll + bankrollChange;

  // Update bet status
  await supabase
    .from("bets")
    .update({ status: newStatus })
    .eq("id", betId);

  // Update bankroll
  await supabase
    .from("profiles")
    .update({ bankroll: newBankroll })
    .eq("id", user.id);

  // Log to history
  await supabase.from("bankroll_history").insert({
    user_id: user.id,
    bet_id: betId,
    change: bankrollChange,
    balance: newBankroll,
    reason: won
      ? `Won: "${bet.title}" (${checkinCount}/${bet.target_checkins} check-ins)`
      : `Lost: "${bet.title}" (${checkinCount}/${bet.target_checkins} check-ins)`,
  });

  revalidatePath("/");
  revalidatePath(`/bets/${betId}`);
  return { success: true, won, checkinCount, target: bet.target_checkins };
}
