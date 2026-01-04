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

      // Check for active investment in user_investments table
      const { data: activeInvestments } = await supabase
        .from("user_investments")
        .select("id")
        .eq("user_id", user.id)
        .eq("state", "active")
        .limit(1);

      // Check for pending payments (not yet approved)
      const { data: pendingPayments } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(1);

      setHasActiveInvestment((activeInvestments?.length ?? 0) > 0);
      setHasPendingPayment((pendingPayments?.length ?? 0) > 0);
      setLoading(false);
    };

    fetchState();

    // Set up real-time subscriptions to update state when changes occur
    const investmentChannel = supabase
      .channel('user-investment-state')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_investments',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchState()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchState()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(investmentChannel);
    };
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
