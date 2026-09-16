import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
  created_at: string | null;
  investing_frozen?: boolean | null;
  main_balance?: number | null;
  profit_balance?: number | null;
  calculated_rank?: string;
  manual_rank?: string | null;
  effective_rank?: string;
  rank_updated_at?: string | null;
}

interface Bundle {
  id: string;
  name: string;
  price_usd: number;
  description: string | null;
  daily_growth_rate: number | null;
  slug: string;
  active: boolean | null;
  min_invest: number | null;
  max_invest: number | null;
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
  proof_url: string | null;
  txid: string | null;
  admin_note: string | null;
  profile?: Profile;
  bundle?: Bundle;
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  network: string;
  currency: string;
  status: string;
  admin_id: string | null;
  admin_note: string | null;
  txid: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

interface Wallet {
  id: string;
  address: string;
  network: string;
  currency: string;
  label: string | null;
  active: boolean | null;
  created_at: string | null;
}

interface UserInvestment {
  id: string;
  user_id: string;
  bundle_id: string;
  payment_id: string | null;
  state: "no_investment" | "pending_payment" | "active" | "paused" | "completed" | "merged";
  initial_amount: number;
  current_value: number;
  growth_percentage: number;
  admin_note: string | null;
  last_updated_by: string | null;
  matures_at: string | null;
  paused_at?: string | null;
  paused_by?: string | null;
  pause_reason?: string | null;
  completed_at?: string | null;
  completed_by?: string | null;
  completion_reason?: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  bundle?: Bundle;
}

interface AdminStats {
  totalUsers: number;
  pendingPayments: number;
  approvedPayments: number;
  pendingWithdrawals: number;
  totalInvestments: number;
  activeInvestments: number;
}

export function useAdminData() {
  const { user, role } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [investments, setInvestments] = useState<UserInvestment[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    pendingWithdrawals: 0,
    totalInvestments: 0,
    activeInvestments: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || role !== "admin") {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch all profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      setProfiles(profilesData || []);

      // Fetch all payments
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch all bundles
      const { data: bundlesData } = await supabase
        .from("bundles")
        .select("*")
        .order("price_usd", { ascending: true });

      setBundles(bundlesData || []);

      // Fetch all wallets
      const { data: walletsData } = await supabase
        .from("wallets")
        .select("*")
        .order("created_at", { ascending: false });

      setWallets(walletsData || []);

      // Fetch all withdrawals
      const { data: withdrawalsData } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch all investments
      const { data: investmentsData } = await supabase
        .from("user_investments")
        .select("*")
        .order("created_at", { ascending: false });

      // Enrich payments with profile and bundle data
      if (paymentsData && profilesData && bundlesData) {
        const profileMap = new Map(profilesData.map((p) => [p.id, p]));
        const bundleMap = new Map(bundlesData.map((b) => [b.id, b]));

        const enrichedPayments = paymentsData.map((p) => ({
          ...p,
          profile: profileMap.get(p.user_id),
          bundle: bundleMap.get(p.bundle_id),
        }));

        setPayments(enrichedPayments);
      }

      // Enrich withdrawals with profile data
      if (withdrawalsData && profilesData) {
        const profileMap = new Map(profilesData.map((p) => [p.id, p]));

        const enrichedWithdrawals = withdrawalsData.map((w) => ({
          ...w,
          profile: profileMap.get(w.user_id),
        }));

        setWithdrawals(enrichedWithdrawals);
      }

      // Enrich investments with profile and bundle data
      if (investmentsData && profilesData && bundlesData) {
        const profileMap = new Map(profilesData.map((p) => [p.id, p]));
        const bundleMap = new Map(bundlesData.map((b) => [b.id, b]));

        const enrichedInvestments = investmentsData.map((i) => ({
          ...i,
          state: i.state as UserInvestment["state"],
          profile: profileMap.get(i.user_id),
          bundle: bundleMap.get(i.bundle_id),
        }));

        setInvestments(enrichedInvestments);
      }

      // Calculate stats
      setStats({
        totalUsers: profilesData?.length || 0,
        pendingPayments: paymentsData?.filter((p) => p.status === "pending").length || 0,
        approvedPayments: paymentsData?.filter((p) => p.status === "approved").length || 0,
        pendingWithdrawals: withdrawalsData?.filter((w) => w.status === "pending").length || 0,
        totalInvestments: investmentsData?.length || 0,
        activeInvestments: investmentsData?.filter((i) => i.state === "active").length || 0,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approvePayment = async (paymentId: string) => {
    // The DB trigger handle_payment_status_change credits the user's
    // main_balance and writes a transaction. We only flip the status.
    const { error } = await supabase
      .from("payments")
      .update({
        status: "approved",
        admin_id: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) {
      toast.error("Failed to approve payment");
      return false;
    }
    toast.success("Deposit approved — funds credited to user's main balance");
    fetchData();
    return true;
  };

  const toggleInvestingFreeze = async (userId: string, frozen: boolean) => {
    const { error } = await supabase.rpc("admin_set_investing_frozen", {
      _user_id: userId,
      _frozen: frozen,
    });
    if (error) {
      toast.error(error.message || "Failed to update freeze state");
      return false;
    }
    toast.success(frozen ? "Investing frozen for this user" : "Investing unfrozen");
    fetchData();
    return true;
  };

  const rejectPayment = async (paymentId: string, note?: string) => {
    const { error } = await supabase
      .from("payments")
      .update({
        status: "rejected",
        admin_note: note || "Payment rejected by management",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) {
      toast.error("Failed to reject payment");
      return false;
    }

    toast.success("Payment rejected");
    fetchData();
    return true;
  };

  const approveWithdrawal = async (withdrawalId: string, txid?: string) => {
    const { error } = await supabase.rpc("admin_approve_withdrawal", {
      _withdrawal_id: withdrawalId,
      _txid: txid || undefined,
    });

    if (error) {
      toast.error(error.message || "Failed to approve withdrawal");
      return false;
    }

    toast.success("Withdrawal approved successfully");
    fetchData();
    return true;
  };

  const rejectWithdrawal = async (withdrawalId: string, note?: string) => {
    const { error } = await supabase.rpc("admin_reject_withdrawal", {
      _withdrawal_id: withdrawalId,
      _note: note || undefined,
    });

    if (error) {
      toast.error(error.message || "Failed to reject withdrawal");
      return false;
    }

    toast.success("Withdrawal rejected");
    fetchData();
    return true;
  };

  const addWallet = async (wallet: Omit<Wallet, "id" | "created_at">) => {
    const { error } = await supabase.from("wallets").insert({
      address: wallet.address,
      network: wallet.network,
      currency: wallet.currency,
      label: wallet.label,
      active: wallet.active ?? true,
    });

    if (error) {
      toast.error("Failed to add wallet");
      return false;
    }

    toast.success("Wallet added successfully");
    fetchData();
    return true;
  };

  const updateWallet = async (walletId: string, updates: Partial<Wallet>) => {
    const { error } = await supabase
      .from("wallets")
      .update(updates)
      .eq("id", walletId);

    if (error) {
      toast.error("Failed to update wallet");
      return false;
    }

    toast.success("Wallet updated successfully");
    fetchData();
    return true;
  };

  const deleteWallet = async (walletId: string) => {
    const { error } = await supabase.from("wallets").delete().eq("id", walletId);

    if (error) {
      toast.error("Failed to delete wallet");
      return false;
    }

    toast.success("Wallet deleted successfully");
    fetchData();
    return true;
  };

  const updateUserStatus = async (userId: string, status: string) => {
    const { error } = await supabase.rpc("admin_set_user_status", {
      _user_id: userId,
      _status: status,
    });

    if (error) {
      toast.error(error.message || "Failed to update user status");
      return false;
    }

    toast.success("User status updated");
    fetchData();
    return true;
  };

  const addBundle = async (bundle: Omit<Bundle, "id">) => {
    const { error } = await supabase.from("bundles").insert({
      name: bundle.name,
      slug: bundle.slug,
      price_usd: bundle.price_usd,
      description: bundle.description,
      daily_growth_rate: bundle.daily_growth_rate,
      active: bundle.active ?? true,
      min_invest: bundle.min_invest,
      max_invest: bundle.max_invest,
    });

    if (error) {
      toast.error("Failed to create bundle");
      return false;
    }

    toast.success("Bundle created successfully");
    fetchData();
    return true;
  };

  const updateBundle = async (bundleId: string, updates: Partial<Bundle>) => {
    const { error } = await supabase
      .from("bundles")
      .update(updates)
      .eq("id", bundleId);

    if (error) {
      toast.error("Failed to update bundle");
      return false;
    }

    toast.success("Bundle updated successfully");
    fetchData();
    return true;
  };

  const deleteBundle = async (bundleId: string) => {
    // Try hard delete first
    const { error } = await supabase.from("bundles").delete().eq("id", bundleId);

    if (error) {
      // If FK constraint prevents deletion, soft-delete by deactivating
      console.warn("Hard delete failed, attempting soft delete:", error.message);
      const { error: softError } = await supabase
        .from("bundles")
        .update({ active: false })
        .eq("id", bundleId);

      if (softError) {
        toast.error("Failed to delete bundle");
        return false;
      }

      toast.success("Bundle deactivated (has linked investments/payments)");
      fetchData();
      return true;
    }

    toast.success("Bundle deleted successfully");
    fetchData();
    return true;
  };

  const applyGrowth = async (
    investmentId: string,
    percentageChange: number,
    changeType: "growth" | "drawdown",
    note?: string
  ) => {
    const { error } = await supabase.rpc("admin_apply_growth", {
      _investment_id: investmentId,
      _percentage_change: percentageChange,
      _change_type: changeType,
      _note: note || undefined,
    });

    if (error) {
      toast.error(error.message || "Failed to apply adjustment");
      return false;
    }

    toast.success(`${changeType === "growth" ? "Growth" : "Drawdown"} applied successfully`);
    fetchData();
    return true;
  };

  const settleInvestment = async (investmentId: string, reason?: string) => {
    const { data, error } = await supabase.rpc("settle_investment", {
      _investment_id: investmentId,
      _reason: reason || undefined,
    });

    if (error) {
      if (error.code === "PGRST202") {
        const fallback = await supabase.rpc("complete_matured_investments");
        if (!fallback.error) {
          toast.success("Investment processed via maturity completion engine");
          fetchData();
          return true;
        }
      }
      toast.error(error.message || "Failed to settle investment");
      return false;
    }

    const res = data as any;
    if (res?.code === "already_completed") {
      toast.info(res.message || "Investment is already completed");
      fetchData();
      return true;
    }

    toast.success(`Settlement completed: $${res?.principal ?? 0} principal + $${res?.profit ?? 0} profit returned`);
    fetchData();
    return true;
  };

  const pauseInvestment = async (investmentId: string, reason?: string) => {
    const { error } = await supabase.rpc("admin_pause_investment", {
      _investment_id: investmentId,
      _reason: reason || undefined,
    });

    if (error) {
      toast.error(error.message || "Failed to pause investment");
      return false;
    }

    toast.success("Investment paused successfully");
    fetchData();
    return true;
  };

  const resumeInvestment = async (investmentId: string, reason?: string) => {
    const { error } = await supabase.rpc("admin_resume_investment", {
      _investment_id: investmentId,
      _reason: reason || undefined,
    });

    if (error) {
      toast.error(error.message || "Failed to resume investment");
      return false;
    }

    toast.success("Investment resumed — maturity date extended");
    fetchData();
    return true;
  };

  const adjustInvestmentRate = async (
    investmentId: string,
    newPercentage: number,
    reason: string
  ) => {
    const { error } = await supabase.rpc("admin_adjust_investment_rate", {
      _investment_id: investmentId,
      _new_percentage: newPercentage,
      _reason: reason,
    });

    if (error) {
      toast.error(error.message || "Failed to adjust rate");
      return false;
    }

    toast.success("Effective growth rate updated");
    fetchData();
    return true;
  };

  const updateInvestmentState = async (
    investmentId: string,
    state: "active" | "paused" | "completed",
    note?: string
  ) => {
    if (state === "completed") {
      return settleInvestment(investmentId, note);
    }
    if (state === "paused") {
      return pauseInvestment(investmentId, note);
    }
    if (state === "active") {
      return resumeInvestment(investmentId, note);
    }
    return false;
  };

  const adjustUserBalance = async (
    userId: string,
    amount: number,
    type: "add" | "deduct",
    reason: string
  ) => {
    const { error } = await supabase.rpc("admin_adjust_user_balance", {
      _user_id: userId,
      _amount: amount,
      _type: type,
      _reason: reason,
    });

    if (error) {
      toast.error(error.message || "Failed to adjust balance");
      return false;
    }

    toast.success(`Balance adjusted: ${type === "add" ? "+$" : "-$"}${amount}`);
    fetchData();
    return true;
  };

  const adjustUserProfit = async (
    userId: string,
    amount: number,
    type: "add" | "deduct",
    reason: string
  ) => {
    const { error } = await supabase.rpc("admin_adjust_user_profit", {
      _user_id: userId,
      _amount: amount,
      _type: type,
      _reason: reason,
    });

    if (error) {
      toast.error(error.message || "Failed to adjust profit");
      return false;
    }

    toast.success(`Profit balance adjusted: ${type === "add" ? "+$" : "-$"}${amount}`);
    fetchData();
    return true;
  };

  const setUserRank = async (
    userId: string,
    manualRank: string | null,
    reason: string
  ) => {
    const { error } = await supabase.rpc("admin_set_user_rank", {
      _user_id: userId,
      _manual_rank: manualRank,
      _reason: reason,
    });

    if (error) {
      toast.error(error.message || "Failed to update user rank");
      return false;
    }

    toast.success("User rank updated successfully");
    fetchData();
    return true;
  };

  const sendNotification = async (
    userId: string,
    title: string,
    message: string,
    type: string = "management"
  ) => {
    const { error } = await supabase.rpc("send_user_notification", {
      _recipient_id: userId,
      _title: title,
      _message: message,
      _type: type,
    });

    if (error) {
      toast.error(error.message || "Failed to send notification");
      return false;
    }

    toast.success("Notification sent to user");
    return true;
  };

  const processAllMatured = async () => {
    const { data, error } = await supabase.rpc("process_all_matured_investments");

    if (error) {
      toast.error(error.message || "Failed to process matured investments");
      return 0;
    }

    const count = typeof data === "number" ? data : 0;
    toast.success(`Processed ${count} matured investment${count === 1 ? "" : "s"}`);
    fetchData();
    return count;
  };

  return {
    profiles,
    payments,
    withdrawals,
    bundles,
    wallets,
    investments,
    stats,
    loading,
    refetch: fetchData,
    approvePayment,
    rejectPayment,
    approveWithdrawal,
    rejectWithdrawal,
    addWallet,
    updateWallet,
    deleteWallet,
    updateUserStatus,
    toggleInvestingFreeze,
    addBundle,
    updateBundle,
    deleteBundle,
    applyGrowth,
    settleInvestment,
    pauseInvestment,
    resumeInvestment,
    adjustInvestmentRate,
    updateInvestmentState,
    adjustUserBalance,
    adjustUserProfit,
    setUserRank,
    sendNotification,
    processAllMatured,
  };
}
