"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCheckin(betId: string, note?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];

  // Upsert so double-tapping is safe
  const { error } = await supabase.from("checkins").upsert(
    {
      bet_id: betId,
      user_id: user.id,
      date: today,
      completed: true,
      note: note || null,
    },
    { onConflict: "bet_id,date" }
  );

  if (error) return { error: error.message };
  revalidatePath(`/bets/${betId}`);
  revalidatePath("/");
  return { success: true };
}

export async function undoCheckin(betId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];

  await supabase
    .from("checkins")
    .delete()
    .eq("bet_id", betId)
    .eq("user_id", user.id)
    .eq("date", today);

  revalidatePath(`/bets/${betId}`);
  revalidatePath("/");
  return { success: true };
}
