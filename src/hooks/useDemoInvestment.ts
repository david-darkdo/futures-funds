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
 * Mulberry32 — fast deterministic PRNG.
 * Same (seed, day) always produces the same daily change, so a user
 * sees a stable history but every user gets a unique trajectory.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Unpredictable demo growth with strong overall uptrend.
 * Each day's % change is drawn from a per-user seeded RNG with:
 *   - large positive bursts (~+8% to +25%) on selected days
 *   - smaller negative dips (~-2% to -15%) on other selected days
 *   - many "hold" days for realism
 *   - average daily drift skewed positive => long-term clear uptrend
 */
function calculateDemoGrowth(initialAmount: number, createdAt: string, seedKey: string) {
  const start = new Date(createdAt);
  const now = new Date();
  const msPerDay = 86400000;
  const totalDays = Math.floor((now.getTime() - start.getTime()) / msPerDay);

  const baseSeed = hashString(seedKey);

  let balance = initialAmount;
  const dailyBalances: { day: number; balance: number; date: Date; action: string; pct: number }[] = [
    { day: 0, balance: initialAmount, date: start, action: "Initial deposit", pct: 0 },
  ];

  for (let d = 1; d <= totalDays; d++) {
    // Per-day deterministic RNG so history doesn't drift between renders.
    const rng = mulberry32(baseSeed ^ (d * 0x9E3779B1));
    const r = rng();
    const r2 = rng();

    let pct = 0; // percent change for this day
    // Distribution: 35% hold, 40% positive move, 25% negative move
    if (r < 0.35) {
      pct = 0;
    } else if (r < 0.75) {
      // Positive: 3% .. 25% (occasional +20% spikes)
      const magnitude = r2 < 0.15 ? 15 + r2 * 100 : 3 + r2 * 12; // mostly modest, sometimes big
      pct = +magnitude.toFixed(2);
    } else {
      // Negative: -2% .. -15%
      const magnitude = r2 < 0.2 ? 8 + r2 * 35 : 2 + r2 * 6;
      pct = -+magnitude.toFixed(2);
    }
    // Bias slightly upward to guarantee long-term uptrend
    pct += 0.4;

    const before = balance;
    balance = Math.max(initialAmount * 0.5, balance * (1 + pct / 100));
    const action =
      pct > 0
        ? `+${pct.toFixed(2)}% growth`
        : pct < 0
        ? `${pct.toFixed(2)}% adjustment`
        : "Holding steady";

    const dayDate = new Date(start.getTime() + d * msPerDay);
    dailyBalances.push({ day: d, balance, date: dayDate, action, pct });
    void before;
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
