import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface DemoInvestment {
  id: string;
  user_id: string;
  bundle_id: string;
  initial_amount: number;
  created_at: string;
  bundle?: {
    name: string;
    slug: string;
    price_usd: number;
    daily_growth_rate: number | null;
  };
}

interface DemoChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface DemoTimelineEvent {
  id: string;
  type: "payment" | "growth" | "withdrawal" | "system";
  title: string;
  description: string;
  date: string;
  amount?: number;
}

/**
 * Deterministic growth calculation for demo investments.
 * Cycle repeats every 3 days:
 *   Day 1: +25% of current total
 *   Day 2: no change
 *   Day 3: -10% of current total
 */
function calculateDemoGrowth(initialAmount: number, createdAt: string) {
  const start = new Date(createdAt);
  const now = new Date();
  const msPerDay = 86400000;
  const totalDays = Math.floor((now.getTime() - start.getTime()) / msPerDay);

  let balance = initialAmount;
  const dailyBalances: { day: number; balance: number; date: Date; action: string }[] = [
    { day: 0, balance: initialAmount, date: start, action: "Initial deposit" },
  ];

  for (let d = 1; d <= totalDays; d++) {
    const cycleDay = ((d - 1) % 3); // 0, 1, 2
    let action = "";
    if (cycleDay === 0) {
      balance = balance * 1.25;
      action = "+25% growth applied";
    } else if (cycleDay === 1) {
      action = "Holding steady";
    } else {
      balance = balance * 0.9;
      action = "-10% market adjustment";
    }
    const dayDate = new Date(start.getTime() + d * msPerDay);
    dailyBalances.push({ day: d, balance, date: dayDate, action });
  }

  return { currentBalance: balance, totalDays, dailyBalances };
}

export function useDemoInvestment() {
  const { user } = useAuth();
  const [demoInvestment, setDemoInvestment] = useState<DemoInvestment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setDemoInvestment(null);
      return;
    }

    const fetchDemo = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("demo_investments")
        .select("*, bundle:bundles(name, slug, price_usd, daily_growth_rate)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      setDemoInvestment(data as DemoInvestment | null);
      setLoading(false);
    };

    fetchDemo();

    const channel = supabase
      .channel("demo-investment-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "demo_investments",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchDemo()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const growthData = useMemo(() => {
    if (!demoInvestment) {
      return { currentValue: 0, growthPercentage: 0, chartData: [] as DemoChartDataPoint[], timelineEvents: [] as DemoTimelineEvent[], dailyChange: 0 };
    }

    const { currentBalance, dailyBalances } = calculateDemoGrowth(
      demoInvestment.initial_amount,
      demoInvestment.created_at
    );

    const growthPercentage = ((currentBalance - demoInvestment.initial_amount) / demoInvestment.initial_amount) * 100;

    // Chart data — limit to last 30 points for readability
    const chartPoints = dailyBalances.slice(-30);
    const chartData: DemoChartDataPoint[] = chartPoints.map((d) => ({
      date: d.date.toISOString(),
      value: Math.round(d.balance * 100) / 100,
      label: `Day ${d.day}`,
    }));

    // Timeline events — last 10 actions
    const timelineEvents: DemoTimelineEvent[] = dailyBalances
      .slice(-10)
      .reverse()
      .map((d, i) => ({
        id: `demo-event-${d.day}`,
        type: d.action.startsWith("+") ? "growth" as const : d.action.startsWith("-") ? "system" as const : "payment" as const,
        title: d.day === 0 ? "Demo Investment Started" : `Demo Day ${d.day}`,
        description: d.day === 0
          ? `Simulated investment of $${demoInvestment.initial_amount.toLocaleString()}`
          : `${d.action} — Balance: $${Math.round(d.balance).toLocaleString()}`,
        date: d.date.toISOString(),
        amount: d.balance - (dailyBalances[dailyBalances.indexOf(d) - 1]?.balance ?? d.balance),
      }));

    // Daily change
    const todayCycleDay = dailyBalances.length > 1 ? ((dailyBalances.length - 2) % 3) : -1;
    let dailyChange = 0;
    if (todayCycleDay === 0) dailyChange = 25;
    else if (todayCycleDay === 2) dailyChange = -10;

    return { currentValue: currentBalance, growthPercentage, chartData, timelineEvents, dailyChange };
  }, [demoInvestment]);

  const createDemo = async (amount: number) => {
    if (!user) return false;
    const STANDARD_PLAN_ID = "dfd788e8-1a28-48c7-83bf-d91338fae6a8";
    const { error } = await supabase.from("demo_investments").insert({
      user_id: user.id,
      bundle_id: STANDARD_PLAN_ID,
      initial_amount: amount,
    });
    return !error;
  };

  const deleteDemo = async () => {
    if (!user || !demoInvestment) return false;
    const { error } = await supabase
      .from("demo_investments")
      .delete()
      .eq("id", demoInvestment.id);
    return !error;
  };

  return {
    demoInvestment,
    loading,
    createDemo,
    deleteDemo,
    hasDemoInvestment: !!demoInvestment,
    ...growthData,
  };
}
