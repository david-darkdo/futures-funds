import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type TransactionType =
  | "deposit"
  | "growth"
  | "drawdown"
  | "withdrawal"
  | "deposit_submitted"
  | "deposit_approved"
  | "deposit_rejected"
  | "investment_started"
  | "investment_completed"
  | "profit_added"
  | "withdrawal_requested"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | string;

export interface Transaction {
  id: string;
  user_id: string;
  investment_id: string | null;
  type: TransactionType;
  amount: number;
  percentage_change: number | null;
  balance_after: number;
  description: string | null;
  created_at: string;
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useTransactions(): UseTransactionsReturn {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch transactions:", error);
    } else {
      setTransactions(
        (data || []).map((t) => ({
          ...t,
          type: t.type as Transaction["type"],
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  // Real-time subscription for transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("user-transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    transactions,
    loading,
    refetch: fetchTransactions,
  };
}

// Generate performance chart data from transactions
export function generateChartFromTransactions(
  transactions: Transaction[]
): Array<{ date: string; value: number; label: string }> {
  if (transactions.length === 0) return [];

  // Sort by date ascending
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return sorted.map((t) => ({
    date: new Date(t.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: t.balance_after,
    label:
      t.type === "deposit"
        ? "Deposit"
        : t.type === "growth"
        ? `+${t.percentage_change}%`
        : t.type === "drawdown"
        ? `-${t.percentage_change}%`
        : "Withdrawal",
  }));
}

// Calculate portfolio metrics from transactions
export function calculatePortfolioMetrics(transactions: Transaction[]) {
  if (transactions.length === 0) {
    return {
      initialCapital: 0,
      currentBalance: 0,
      totalGrowthPercent: 0,
      totalProfit: 0,
    };
  }

  // Get first deposit as initial capital
  const deposits = transactions.filter((t) => t.type === "deposit");
  const initialCapital = deposits.reduce((sum, d) => sum + d.amount, 0);

  // Current balance is the most recent balance_after
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const currentBalance = sorted[0]?.balance_after || 0;

  // Calculate profit and growth
  const totalProfit = currentBalance - initialCapital;
  const totalGrowthPercent = initialCapital > 0 ? (totalProfit / initialCapital) * 100 : 0;

  return {
    initialCapital,
    currentBalance,
    totalGrowthPercent,
    totalProfit,
  };
}
