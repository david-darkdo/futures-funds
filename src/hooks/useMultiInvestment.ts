import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Investment {
  id: string;
  user_id: string;
  bundle_id: string;
  payment_id: string | null;
  state: "no_investment" | "pending_payment" | "active" | "paused" | "completed" | "merged";
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

export interface PendingInvestmentPayment {
  id: string;
  bundle_id: string;
  crypto_amount: number | null;
  crypto_currency: string | null;
  status: string | null;
  created_at: string | null;
  bundle?: {
    name: string;
    price_usd: number;
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

interface AggregatedPortfolio {
  totalInitialAmount: number;
  totalCurrentValue: number;
  totalGrowthPercentage: number;
  activeInvestmentsCount: number;
  primaryBundleName: string | null;
}

interface UseMultiInvestmentReturn {
  // Active investments (contributing to balance)
  activeInvestments: Investment[];
  
  // Pending payments awaiting approval
  pendingPayments: PendingInvestmentPayment[];
  
  // Aggregated portfolio data
  portfolio: AggregatedPortfolio;
  
  // Combined growth logs from all active investments
  growthLogs: GrowthLog[];
  
  // Loading state
  loading: boolean;
  
  // Refetch function
  refetch: () => Promise<void>;
  
  // State indicators
  hasActiveInvestment: boolean;
  hasPendingPayment: boolean;
}

export function useMultiInvestment(): UseMultiInvestmentReturn {
  const { user } = useAuth();
  const [activeInvestments, setActiveInvestments] = useState<Investment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingInvestmentPayment[]>([]);
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch all active investments
      const { data: investmentsData } = await supabase
        .from("user_investments")
        .select("*")
        .eq("user_id", user.id)
        .eq("state", "active")
        .order("created_at", { ascending: false });

      if (investmentsData && investmentsData.length > 0) {
        // Fetch bundle info for all investments
        const bundleIds = [...new Set(investmentsData.map(i => i.bundle_id))];
        const { data: bundlesData } = await supabase
          .from("bundles")
          .select("id, name, price_usd, daily_growth_rate")
          .in("id", bundleIds);

        const bundleMap = new Map(bundlesData?.map(b => [b.id, b]) || []);

        const enrichedInvestments = investmentsData.map(inv => ({
          ...inv,
          state: inv.state as Investment["state"],
          bundle: bundleMap.get(inv.bundle_id),
        }));

        setActiveInvestments(enrichedInvestments);

        // Fetch growth logs for all active investments
        const investmentIds = investmentsData.map(i => i.id);
        const { data: logsData } = await supabase
          .from("investment_growth_logs")
          .select("*")
          .in("investment_id", investmentIds)
          .order("created_at", { ascending: true });

        setGrowthLogs(
          (logsData || []).map(log => ({
            ...log,
            change_type: log.change_type as GrowthLog["change_type"],
          }))
        );
      } else {
        setActiveInvestments([]);
        setGrowthLogs([]);
      }

      // Fetch pending payments (not yet approved)
      const { data: pendingPaymentsData } = await supabase
        .from("payments")
        .select("id, bundle_id, crypto_amount, crypto_currency, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingPaymentsData && pendingPaymentsData.length > 0) {
        // Fetch bundle info for pending payments
        const bundleIds = [...new Set(pendingPaymentsData.map(p => p.bundle_id))];
        const { data: bundlesData } = await supabase
          .from("bundles")
          .select("id, name, price_usd")
          .in("id", bundleIds);

        const bundleMap = new Map(bundlesData?.map(b => [b.id, { name: b.name, price_usd: b.price_usd }]) || []);

        const enrichedPayments = pendingPaymentsData.map(p => ({
          ...p,
          bundle: bundleMap.get(p.bundle_id),
        }));

        setPendingPayments(enrichedPayments);
      } else {
        setPendingPayments([]);
      }
    } catch (error) {
      console.error("Error fetching multi-investment data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("multi-investment-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_investments",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "investment_growth_logs",
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Calculate aggregated portfolio
  const portfolio = useMemo((): AggregatedPortfolio => {
    if (activeInvestments.length === 0) {
      return {
        totalInitialAmount: 0,
        totalCurrentValue: 0,
        totalGrowthPercentage: 0,
        activeInvestmentsCount: 0,
        primaryBundleName: null,
      };
    }

    const totalInitialAmount = activeInvestments.reduce((sum, inv) => sum + inv.initial_amount, 0);
    const totalCurrentValue = activeInvestments.reduce((sum, inv) => sum + inv.current_value, 0);
    const totalGrowthPercentage = totalInitialAmount > 0 
      ? ((totalCurrentValue - totalInitialAmount) / totalInitialAmount) * 100 
      : 0;

    // Get the most recent or highest-value bundle as primary
    const primaryInvestment = activeInvestments[0];
    const primaryBundleName = primaryInvestment?.bundle?.name || null;

    return {
      totalInitialAmount,
      totalCurrentValue,
      totalGrowthPercentage,
      activeInvestmentsCount: activeInvestments.length,
      primaryBundleName,
    };
  }, [activeInvestments]);

  const hasActiveInvestment = activeInvestments.length > 0;
  const hasPendingPayment = pendingPayments.length > 0;

  return {
    activeInvestments,
    pendingPayments,
    portfolio,
    growthLogs,
    loading,
    refetch: fetchData,
    hasActiveInvestment,
    hasPendingPayment,
  };
}

// Generate chart data from aggregated growth logs
export function generateChartDataFromMultiLogs(
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

  // Sort logs by date
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Add each log as a data point
  sortedLogs.forEach((log) => {
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
