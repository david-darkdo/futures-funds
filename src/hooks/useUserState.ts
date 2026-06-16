import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserDashboardState = "loading" | "start" | "pending" | "portfolio";

interface UserStateData {
  state: UserDashboardState;
  hasPendingPayment: boolean;
  hasActiveInvestment: boolean;
  hasDemoInvestment: boolean;
  pendingPaymentsCount: number;
  activeInvestmentsCount: number;
  loading: boolean;
}

export function useUserState(): UserStateData {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [activeInvestmentsCount, setActiveInvestmentsCount] = useState(0);
  const [demoCount, setDemoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let isInitial = true;

    const fetchState = async () => {
      // Only show the global loading state on the very first fetch.
      // Background refetches (realtime updates) must not flip loading back to
      // true, otherwise gated routes unmount their content and any open
      // dialog (e.g. a half-filled payment-proof form) is lost.
      if (isInitial) setLoading(true);

      const [activeRes, pendingRes] = await Promise.all([
        supabase
          .from("user_investments")
          .select("id", { count: "exact" })
          .eq("user_id", userId)
          .eq("state", "active"),
        supabase
          .from("payments")
          .select("id", { count: "exact" })
          .eq("user_id", userId)
          .eq("status", "pending"),
      ]);

      if (cancelled) return;

      setActiveInvestmentsCount(activeRes.count ?? activeRes.data?.length ?? 0);
      setPendingPaymentsCount(pendingRes.count ?? pendingRes.data?.length ?? 0);
      setDemoCount(0);
      setLoading(false);
      isInitial = false;
    };

    fetchState();

    const channel = supabase
      .channel(`user-investment-state-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_investments', filter: `user_id=eq.${userId}` }, () => fetchState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${userId}` }, () => fetchState())
      .subscribe();


    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const hasPendingPayment = pendingPaymentsCount > 0;
  const hasActiveInvestment = activeInvestmentsCount > 0;
  const hasDemoInvestment = demoCount > 0;

  const state = useMemo((): UserDashboardState => {
    if (loading) return "loading";
    if (hasActiveInvestment) return "portfolio";
    if (hasDemoInvestment) return "portfolio"; // Demo users see portfolio
    if (hasPendingPayment) return "pending";
    return "start";
  }, [loading, hasActiveInvestment, hasDemoInvestment, hasPendingPayment]);

  return {
    state,
    hasPendingPayment,
    hasActiveInvestment,
    hasDemoInvestment,
    pendingPaymentsCount,
    activeInvestmentsCount,
    loading
  };
}
