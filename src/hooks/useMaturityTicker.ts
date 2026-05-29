import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Polls the complete_matured_investments RPC every 60s while mounted.
 * The RPC is idempotent — only investments past matures_at get completed.
 */
export function useMaturityTicker(onComplete?: () => void) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await supabase.rpc("complete_matured_investments");
        if (!cancelled && typeof data === "number" && data > 0) {
          onComplete?.();
        }
      } catch (e) {
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
