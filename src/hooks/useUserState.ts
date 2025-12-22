import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserDashboardState = "loading" | "start" | "pending" | "portfolio";

interface UserStateData {
  state: UserDashboardState;
  hasPendingPayment: boolean;
  hasActiveInvestment: boolean;
  loading: boolean;
}

export function useUserState(): UserStateData {
  const { user } = useAuth();
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [hasActiveInvestment, setHasActiveInvestment] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchState = async () => {
      setLoading(true);

      // Check for pending payments
      const { data: pendingPayments } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(1);

      // Check for approved payments (active investment)
      const { data: approvedPayments } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .limit(1);

      setHasPendingPayment((pendingPayments?.length ?? 0) > 0);
      setHasActiveInvestment((approvedPayments?.length ?? 0) > 0);
      setLoading(false);
    };

    fetchState();
  }, [user]);

  const state = useMemo((): UserDashboardState => {
    if (loading) return "loading";
    if (hasActiveInvestment) return "portfolio";
    if (hasPendingPayment) return "pending";
    return "start";
  }, [loading, hasActiveInvestment, hasPendingPayment]);

  return {
    state,
    hasPendingPayment,
    hasActiveInvestment,
    loading
  };
}
