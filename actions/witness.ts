"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { WitnessBet } from "@/lib/types";

export async function createWitnessLink(betId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const token = crypto.randomUUID();

  const { error } = await supabase
    .from("bets")
    .update({ witness_token: token })
    .eq("id", betId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/bets/${betId}`);
  return { success: true, token };
}

// Public — called from the unauthenticated /witness/[token] page. Access is
// gated by knowledge of the token itself (see get_witness_bet in schema.sql),
// not by a session, so this works for a friend with no account.
export async function getWitnessBet(token: string): Promise<WitnessBet | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_witness_bet", { p_token: token });
  if (error || !data) return null;
  return data as WitnessBet;
}

export async function submitWitnessVerdict(token: string, success: boolean) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_witness_verdict", {
    p_token: token,
    p_success: success,
  });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { success: true };
}
