import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserDashboardState = "loading" | "start" | "pending" | "portfolio";

interface UserStateData {
  state: UserDashboardState;
  hasPendingPayment: boolean;
  hasActiveInvestment: boolean;
  pendingPaymentsCount: number;
  activeInvestmentsCount: number;
  loading: boolean;
}

export function useUserState(): UserStateData {
  const { user } = useAuth();
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [activeInvestmentsCount, setActiveInvestmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchState = async () => {
      setLoading(true);

      // Check for active investments in user_investments table
      const { data: activeInvestments, count: activeCount } = await supabase
        .from("user_investments")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("state", "active");

      // Check for pending payments (not yet approved)
      const { data: pendingPayments, count: pendingCount } = await supabase
        .from("payments")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("status", "pending");

      setActiveInvestmentsCount(activeCount ?? activeInvestments?.length ?? 0);
      setPendingPaymentsCount(pendingCount ?? pendingPayments?.length ?? 0);
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

  const hasPendingPayment = pendingPaymentsCount > 0;
  const hasActiveInvestment = activeInvestmentsCount > 0;

  // Updated routing logic:
  // - If user has ANY active investment → show portfolio (even if they also have pending)
  // - If user has ONLY pending payments (no active) → show pending
  // - Otherwise → show start
  const state = useMemo((): UserDashboardState => {
    if (loading) return "loading";
    if (hasActiveInvestment) return "portfolio"; // Portfolio takes priority
    if (hasPendingPayment) return "pending";
    return "start";
  }, [loading, hasActiveInvestment, hasPendingPayment]);

  return {
    state,
    hasPendingPayment,
    hasActiveInvestment,
    pendingPaymentsCount,
    activeInvestmentsCount,
    loading
  };
}
