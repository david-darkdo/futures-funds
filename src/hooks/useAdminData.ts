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
}

interface Bundle {
  id: string;
  name: string;
  price_usd: number;
  description: string | null;
  daily_growth_rate: number | null;
  slug: string;
  active: boolean | null;
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
  state: "no_investment" | "pending_payment" | "active" | "paused" | "completed";
  initial_amount: number;
  current_value: number;
  growth_percentage: number;
  admin_note: string | null;
  last_updated_by: string | null;
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
    // Get payment details first
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) {
      toast.error("Payment not found");
      return false;
    }

    // Update payment status to approved
    const { error: paymentError } = await supabase
      .from("payments")
      .update({ 
        status: "approved", 
        admin_id: user?.id,
        updated_at: new Date().toISOString() 
      })
      .eq("id", paymentId);

    if (paymentError) {
      toast.error("Failed to approve payment");
      return false;
    }

    // Create user_investments record
    const bundlePrice = payment.bundle?.price_usd || 0;
    const { data: investmentData, error: investmentError } = await supabase
      .from("user_investments")
      .insert({
        user_id: payment.user_id,
        bundle_id: payment.bundle_id,
        payment_id: paymentId,
        initial_amount: bundlePrice,
        current_value: bundlePrice,
        growth_percentage: 0,
        state: "active",
      })
      .select()
      .single();

    if (investmentError) {
      console.error("Failed to create investment:", investmentError);
      toast.warning("Payment approved but investment record may need manual creation");
    } else {
      // Log deposit transaction
      await supabase.from("transactions").insert({
        user_id: payment.user_id,
        investment_id: investmentData.id,
        type: "deposit",
        amount: bundlePrice,
        balance_after: bundlePrice,
        description: `Initial investment - ${payment.bundle?.name || "Investment Bundle"}`,
      });

      toast.success("Payment approved and investment activated!");
    }

    fetchData();
    return true;
  };

  const rejectPayment = async (paymentId: string, note?: string) => {
    const { error } = await supabase
      .from("payments")
      .update({
        status: "rejected",
        admin_note: note || "Payment rejected by admin",
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
    // Get withdrawal details
    const withdrawal = withdrawals.find((w) => w.id === withdrawalId);
    if (!withdrawal) {
      toast.error("Withdrawal not found");
      return false;
    }

    const { error } = await supabase
      .from("withdrawals")
      .update({
        status: "approved",
        txid: txid || null,
        admin_id: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId);

    if (error) {
      toast.error("Failed to approve withdrawal");
      return false;
    }

    // Get user's active investment to get current balance
    const userInvestment = investments.find(
      (i) => i.user_id === withdrawal.user_id && i.state === "active"
    );
    
    if (userInvestment) {
      const newBalance = userInvestment.current_value - withdrawal.amount;
      
      // Update investment current value
      await supabase
        .from("user_investments")
        .update({ 
          current_value: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userInvestment.id);

      // Log withdrawal transaction
      await supabase.from("transactions").insert({
        user_id: withdrawal.user_id,
        investment_id: userInvestment.id,
        type: "withdrawal",
        amount: withdrawal.amount,
        balance_after: newBalance,
        description: `Withdrawal processed - ${withdrawal.currency} to ${withdrawal.network}`,
      });
    }

    toast.success("Withdrawal approved successfully");
    fetchData();
    return true;
  };

  const rejectWithdrawal = async (withdrawalId: string, note?: string) => {
    const { error } = await supabase
      .from("withdrawals")
      .update({
        status: "rejected",
        admin_note: note || "Withdrawal rejected by admin",
        admin_id: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId);

    if (error) {
      toast.error("Failed to reject withdrawal");
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
    const { error } = await supabase
      .from("profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update user status");
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
    const { error } = await supabase.from("bundles").delete().eq("id", bundleId);

    if (error) {
      toast.error("Failed to delete bundle");
      return false;
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
    // Get current investment
    const investment = investments.find((i) => i.id === investmentId);
    if (!investment) {
      toast.error("Investment not found");
      return false;
    }

    const balanceBefore = investment.current_value;
    const multiplier = changeType === "growth" 
      ? 1 + percentageChange / 100 
      : 1 - percentageChange / 100;
    const balanceAfter = balanceBefore * multiplier;
    const newGrowthPercentage = ((balanceAfter - investment.initial_amount) / investment.initial_amount) * 100;
    const amountChange = Math.abs(balanceAfter - balanceBefore);

    // Update investment
    const { error: updateError } = await supabase
      .from("user_investments")
      .update({
        current_value: balanceAfter,
        growth_percentage: newGrowthPercentage,
        admin_note: note || null,
        last_updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", investmentId);

    if (updateError) {
      toast.error("Failed to apply growth");
      return false;
    }

    // Log the change in investment_growth_logs
    const { error: logError } = await supabase.from("investment_growth_logs").insert({
      investment_id: investmentId,
      admin_id: user?.id,
      change_type: changeType,
      percentage_change: percentageChange,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      admin_note: note || null,
    });

    if (logError) {
      console.error("Failed to log growth change:", logError);
    }

    // Log transaction for user history
    await supabase.from("transactions").insert({
      user_id: investment.user_id,
      investment_id: investmentId,
      type: changeType,
      amount: amountChange,
      percentage_change: percentageChange,
      balance_after: balanceAfter,
      description: changeType === "growth" 
        ? `Company Performance Update: +${percentageChange}%`
        : `Company Performance Update: -${percentageChange}%`,
    });

    toast.success(`${changeType === "growth" ? "Growth" : "Drawdown"} applied successfully`);
    fetchData();
    return true;
  };

  const updateInvestmentState = async (
    investmentId: string,
    state: "active" | "paused" | "completed",
    note?: string
  ) => {
    const { error } = await supabase
      .from("user_investments")
      .update({
        state,
        admin_note: note || null,
        last_updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", investmentId);

    if (error) {
      toast.error("Failed to update investment state");
      return false;
    }

    toast.success(`Investment state updated to ${state}`);
    fetchData();
    return true;
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
    addBundle,
    updateBundle,
    deleteBundle,
    applyGrowth,
    updateInvestmentState,
  };
}
