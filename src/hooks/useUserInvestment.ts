import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserInvestment {
  id: string;
  user_id: string;
  bundle_id: string;
  payment_id: string | null;
  state: "no_investment" | "pending_payment" | "active" | "paused" | "completed";
  initial_amount: number;
  current_value: number;
  growth_percentage: number;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  bundle?: {
    id: string;
    name: string;
    price_usd: number;
    daily_growth_rate: number | null;
  };
}

export interface GrowthLog {
  id: string;
  investment_id: string;
  admin_id: string;
  change_type: "growth" | "drawdown" | "manual_adjustment";
  percentage_change: number;
  balance_before: number;
  balance_after: number;
  admin_note: string | null;
  created_at: string;
}

interface UseUserInvestmentReturn {
  investment: UserInvestment | null;
  growthLogs: GrowthLog[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useUserInvestment(): UseUserInvestmentReturn {
  const { user } = useAuth();
  const [investment, setInvestment] = useState<UserInvestment | null>(null);
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch active investment
    const { data: investmentData } = await supabase
      .from("user_investments")
      .select("*")
      .eq("user_id", user.id)
      .eq("state", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (investmentData) {
      // Fetch bundle info
      const { data: bundleData } = await supabase
        .from("bundles")
        .select("id, name, price_usd, daily_growth_rate")
        .eq("id", investmentData.bundle_id)
        .maybeSingle();

      const typedInvestment: UserInvestment = {
        ...investmentData,
        state: investmentData.state as UserInvestment["state"],
        bundle: bundleData || undefined,
      };

      setInvestment(typedInvestment);

      // Fetch growth logs for chart
      const { data: logsData } = await supabase
        .from("investment_growth_logs")
        .select("*")
        .eq("investment_id", investmentData.id)
        .order("created_at", { ascending: true });

      setGrowthLogs(
        (logsData || []).map((log) => ({
          ...log,
          change_type: log.change_type as GrowthLog["change_type"],
        }))
      );
    } else {
      setInvestment(null);
      setGrowthLogs([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Set up realtime subscriptions for investments and growth logs
  useEffect(() => {
    if (!user) return;

    const investmentChannel = supabase
      .channel("user-investments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_investments",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(investmentChannel);
    };
  }, [user]);

  // Separate subscription for growth logs (needs investment ID)
  useEffect(() => {
    if (!user || !investment) return;

    const logsChannel = supabase
      .channel(`growth-logs-${investment.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "investment_growth_logs",
          filter: `investment_id=eq.${investment.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
    };
  }, [user, investment?.id]);

  return {
    investment,
    growthLogs,
    loading,
    refetch: fetchData,
  };
}

// Generate chart data from growth logs
export function generateChartDataFromLogs(
  initialAmount: number,
  startDate: string,
  logs: GrowthLog[]
): Array<{ date: string; value: number; label: string }> {
  const dataPoints: Array<{ date: string; value: number; label: string }> = [];

  // Start point
  dataPoints.push({
    date: new Date(startDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: initialAmount,
    label: "Initial",
  });

  // Add each log as a data point
  logs.forEach((log) => {
    dataPoints.push({
      date: new Date(log.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: log.balance_after,
      label:
        log.change_type === "growth"
          ? `+${log.percentage_change}%`
          : log.change_type === "drawdown"
          ? `-${log.percentage_change}%`
          : "Adjusted",
    });
  });

  return dataPoints;
}
