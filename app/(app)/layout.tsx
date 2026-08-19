import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("bankroll")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Navigation bankroll={profile?.bankroll ?? 10000} />
      <main>{children}</main>
    </>
  );
}
