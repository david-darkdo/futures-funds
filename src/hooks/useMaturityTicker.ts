import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { notifyEmail } from "@/lib/notify";

/**
 * Polls the complete_matured_investments RPC every 60s while mounted.
 * The RPC is idempotent — only investments past matures_at get completed.
 * After completion, sends profit notification emails for newly-completed cycles.
 */
export function useMaturityTicker(onComplete?: () => void) {
  const { user } = useAuth();
  const seenCompleted = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await supabase.rpc("complete_matured_investments");
        if (cancelled) return;
        if (typeof data === "number" && data > 0) {
          // Find the freshly completed investments to fire profit emails
          const { data: completed } = await supabase
            .from("user_investments")
            .select("id, initial_amount, current_value, bundle_id, bundles(name)")
            .eq("user_id", user.id)
            .eq("state", "completed")
            .order("completed_at", { ascending: false })
            .limit(data);
          for (const inv of completed || []) {
            if (seenCompleted.current.has(inv.id)) continue;
            seenCompleted.current.add(inv.id);
            const profit = Math.max(0, Number(inv.current_value) - Number(inv.initial_amount));
            notifyEmail("profit", {
              amount: profit.toFixed(2),
              bundleName: (inv as any).bundles?.name || "Investment",
            });
          }
          onComplete?.();
        }
      } catch {
        // silent
      }
    };

    run();
    const id = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user, onComplete]);
}
