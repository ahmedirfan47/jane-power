import { createClient } from "@/lib/supabase/server";
import { TerminalShell } from "@/components/terminal/terminal-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function TerminalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <TerminalShell email="" role="guest" isGuest />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return <TerminalShell email={user.email ?? ""} role={profile?.role ?? "viewer"} isGuest={false} />;
}