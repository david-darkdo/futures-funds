import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
  created_at: string | null;
  avatar_url?: string | null;
  theme?: string | null;
  language?: string | null;
}

interface Bundle {
  id: string;
  name: string;
  price_usd: number;
  description: string | null;
  daily_growth_rate: number | null;
  slug: string;
}

interface Payment {
  id: string;
  user_id: string;
  bundle_id: string;
  crypto_amount: number | null;
  crypto_currency: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  bundle?: Bundle;
}

interface DashboardData {
  profile: Profile | null;
  payments: Payment[];
  activePayment: Payment | null;
  loading: boolean;
}

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(profileData);

      // Fetch payments with bundle info
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (paymentsData && paymentsData.length > 0) {
        // Fetch bundles for the payments
        const bundleIds = [...new Set(paymentsData.map(p => p.bundle_id))];
        const { data: bundlesData } = await supabase
          .from("bundles")
          .select("*")
          .in("id", bundleIds);

        const bundleMap = new Map(bundlesData?.map(b => [b.id, b]) || []);
        
        const paymentsWithBundles = paymentsData.map(p => ({
          ...p,
          bundle: bundleMap.get(p.bundle_id) as Bundle | undefined
        }));

        setPayments(paymentsWithBundles);
      } else {
        setPayments([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Find the active (approved) payment
  const activePayment = payments.find(p => p.status === "approved") || null;

  return {
    profile,
    payments,
    activePayment,
    loading
  };
}

// Calculate growth based on daily rate and days since approval
export function calculateGrowth(
  startAmount: number,
  dailyRate: number,
  startDate: string
): { currentValue: number; growth: number; growthPercent: number; daysActive: number } {
  const start = new Date(startDate);
  const now = new Date();
  const daysActive = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Compound growth formula: P * (1 + r)^t
  const rateDecimal = dailyRate / 100;
  const currentValue = startAmount * Math.pow(1 + rateDecimal, daysActive);
  const growth = currentValue - startAmount;
  const growthPercent = ((currentValue - startAmount) / startAmount) * 100;

  return {
    currentValue: Math.round(currentValue * 100) / 100,
    growth: Math.round(growth * 100) / 100,
    growthPercent: Math.round(growthPercent * 100) / 100,
    daysActive
  };
}

// Generate chart data points for growth visualization
export function generateGrowthChartData(
  startAmount: number,
  dailyRate: number,
  startDate: string,
  days: number = 30
): Array<{ day: number; value: number; date: string }> {
  const start = new Date(startDate);
  const now = new Date();
  const daysActive = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const dataPoints = Math.min(days, Math.max(daysActive, 7));
  const rateDecimal = dailyRate / 100;

  return Array.from({ length: dataPoints }, (_, i) => {
    const value = startAmount * Math.pow(1 + rateDecimal, i);
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    
    return {
      day: i,
      value: Math.round(value * 100) / 100,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });
}