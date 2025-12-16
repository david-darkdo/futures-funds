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

interface AdminStats {
  totalUsers: number;
  pendingPayments: number;
  approvedPayments: number;
  pendingWithdrawals: number;
}

export function useAdminData() {
  const { user, role } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    pendingWithdrawals: 0,
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

      // Calculate stats
      setStats({
        totalUsers: profilesData?.length || 0,
        pendingPayments: paymentsData?.filter((p) => p.status === "pending").length || 0,
        approvedPayments: paymentsData?.filter((p) => p.status === "approved").length || 0,
        pendingWithdrawals: withdrawalsData?.filter((w) => w.status === "pending").length || 0,
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
    const { error } = await supabase
      .from("payments")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", paymentId);

    if (error) {
      toast.error("Failed to approve payment");
      return false;
    }

    toast.success("Payment approved successfully");
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

  return {
    profiles,
    payments,
    withdrawals,
    bundles,
    wallets,
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
  };
}
