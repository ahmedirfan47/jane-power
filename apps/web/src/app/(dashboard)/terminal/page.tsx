import { createClient } from "@/lib/supabase/server";
import { TerminalShell } from "@/components/terminal/terminal-shell";

export default async function TerminalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();

  return <TerminalShell email={user!.email ?? ""} role={profile?.role ?? "viewer"} />;
}