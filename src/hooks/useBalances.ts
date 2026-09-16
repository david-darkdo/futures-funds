import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface RunningInvestment {
  id: string;
  bundle_id: string;
  initial_amount: number;
  current_value: number;
  growth_percentage: number;
  state: string;
  matures_at: string | null;
  paused_at?: string | null;
  created_at: string;
  bundle?: { id: string; name: string; daily_growth_rate: number | null };
}

export interface Balances {
  mainBalance: number;
  profitBalance: number;
  investedAmount: number;
  investingFrozen: boolean;
  runningInvestments: RunningInvestment[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useBalances(): Balances {
  const { user } = useAuth();
  const [mainBalance, setMainBalance] = useState(0);
  const [profitBalance, setProfitBalance] = useState(0);
  const [investingFrozen, setInvestingFrozen] = useState(false);
  const [running, setRunning] = useState<RunningInvestment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [profileRes, invRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("main_balance, profit_balance, investing_frozen")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_investments")
        .select("id, bundle_id, initial_amount, current_value, growth_percentage, state, matures_at, paused_at, created_at")
        .eq("user_id", user.id)
        .in("state", ["active", "paused"])
        .order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) {
      setMainBalance(Number((profileRes.data as any).main_balance ?? 0));
      setProfitBalance(Number((profileRes.data as any).profit_balance ?? 0));
      setInvestingFrozen(Boolean((profileRes.data as any).investing_frozen));
    }

    const investments = (invRes.data || []) as any[];
    if (investments.length) {
      const bundleIds = [...new Set(investments.map((i) => i.bundle_id))];
      const { data: bundlesData } = await supabase
        .from("bundles")
        .select("id, name, daily_growth_rate")
        .in("id", bundleIds);
      const bundleMap = new Map((bundlesData || []).map((b: any) => [b.id, b]));
      setRunning(
        investments.map((i) => ({
          id: i.id,
          bundle_id: i.bundle_id,
          initial_amount: Number(i.initial_amount),
          current_value: Number(i.current_value || i.initial_amount),
          growth_percentage: Number(i.growth_percentage || 0),
          state: i.state,
          matures_at: i.matures_at,
          paused_at: i.paused_at,
          created_at: i.created_at,
          bundle: bundleMap.get(i.bundle_id) as any,
        }))
      );
    } else {
      setRunning([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("balances-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_investments", filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchAll]);

  const investedAmount = running.reduce((s, i) => s + i.initial_amount, 0);

  return {
    mainBalance,
    profitBalance,
    investedAmount,
    investingFrozen,
    runningInvestments: running,
    loading,
    refetch: fetchAll,
  };
}
