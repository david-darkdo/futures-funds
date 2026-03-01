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
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [activeInvestmentsCount, setActiveInvestmentsCount] = useState(0);
  const [demoCount, setDemoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchState = async () => {
      setLoading(true);

      const [activeRes, pendingRes, demoRes] = await Promise.all([
        supabase
          .from("user_investments")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("state", "active"),
        supabase
          .from("payments")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "pending"),
        supabase
          .from("demo_investments")
          .select("id", { count: "exact" })
          .eq("user_id", user.id),
      ]);

      setActiveInvestmentsCount(activeRes.count ?? activeRes.data?.length ?? 0);
      setPendingPaymentsCount(pendingRes.count ?? pendingRes.data?.length ?? 0);
      setDemoCount(demoRes.count ?? demoRes.data?.length ?? 0);
      setLoading(false);
    };

    fetchState();

    const channel = supabase
      .channel('user-investment-state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_investments', filter: `user_id=eq.${user.id}` }, () => fetchState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` }, () => fetchState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demo_investments', filter: `user_id=eq.${user.id}` }, () => fetchState())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
