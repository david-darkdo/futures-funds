import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget transactional email via the send-email edge function.
 * Failures are silently logged so they never block the calling action.
 */
export async function notifyEmail(
  type: "deposit" | "investment" | "profit" | "withdrawal" | "custom",
  extra: Record<string, any> = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    const to = (profile as any)?.email || user.email;
    if (!to) return;
    await supabase.functions.invoke("send-email", {
      body: {
        type,
        to,
        fullName: (profile as any)?.full_name || "Investor",
        userId: user.id,
        ...extra,
      },
    });
  } catch (e) {
    console.warn("[notifyEmail] failed:", e);
  }
}
