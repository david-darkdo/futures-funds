import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Mail,
  Calendar,
  Wallet,
  DollarSign,
  TrendingUp,
  Snowflake,
  Sun,
  Shield,
  Bell,
  Award,
  History,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { InvestmentStatusBadge } from "@/components/dashboard/InvestmentStatusBadge";

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

interface UserDetailDrawerProps {
  user: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (userId: string, status: string) => Promise<boolean>;
  onToggleFreeze: (userId: string, frozen: boolean) => Promise<boolean>;
  onAdjustBalance: (
    userId: string,
    amount: number,
    type: "add" | "deduct",
    reason: string
  ) => Promise<boolean>;
  onAdjustProfit: (
    userId: string,
    amount: number,
    type: "add" | "deduct",
    reason: string
  ) => Promise<boolean>;
  onSetRank: (
    userId: string,
    manualRank: string | null,
    reason: string
  ) => Promise<boolean>;
  onSendNotification: (
    userId: string,
    title: string,
    message: string,
    type?: string
  ) => Promise<boolean>;
  userInvestments?: any[];
  userPayments?: any[];
  userWithdrawals?: any[];
  onRefresh?: () => void;
}

export function UserDetailDrawer({
  user,
  isOpen,
  onClose,
  onUpdateStatus,
  onToggleFreeze,
  onAdjustBalance,
  onAdjustProfit,
  onSetRank,
  onSendNotification,
  userInvestments = [],
  userPayments = [],
  userWithdrawals = [],
  onRefresh,
}: UserDetailDrawerProps) {
  // Balance Dialog State
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceType, setBalanceType] = useState<"add" | "deduct">("add");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");
  const [isSubmittingBalance, setIsSubmittingBalance] = useState(false);

  // Profit Dialog State
  const [profitDialogOpen, setProfitDialogOpen] = useState(false);
  const [profitType, setProfitType] = useState<"add" | "deduct">("add");
  const [profitAmount, setProfitAmount] = useState("");
  const [profitReason, setProfitReason] = useState("");
  const [isSubmittingProfit, setIsSubmittingProfit] = useState(false);

  // Rank Dialog State
  const [rankDialogOpen, setRankDialogOpen] = useState(false);
  const [selectedRank, setSelectedRank] = useState<string>("auto");
  const [rankReason, setRankReason] = useState("");
  const [isSubmittingRank, setIsSubmittingRank] = useState(false);

  // Notification Dialog State
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("management");
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Activity & Audit log
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserHistory(user.id);
      setSelectedRank(user.manual_rank || "auto");
    }
  }, [user, isOpen]);

  const fetchUserHistory = async (userId: string) => {
    setLoadingHistory(true);
    try {
      const [auditRes, txRes] = await Promise.all([
        supabase
          .from("management_audit_log")
          .select("*")
          .eq("target_user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (auditRes.data) setAuditLogs(auditRes.data);
      if (txRes.data) setTransactions(txRes.data);
    } catch (err) {
      console.error("Error fetching user history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!user) return null;

  // Financial aggregates
  const totalApprovedDeposits = userPayments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + (p.crypto_amount || p.bundle?.price_usd || 0), 0);

  const totalApprovedWithdrawals = userWithdrawals
    .filter((w) => w.status === "approved")
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  const activeInvestmentsTotal = userInvestments
    .filter((i) => i.state === "active")
    .reduce((sum, i) => sum + (i.initial_amount || 0), 0);

  const handleBalanceSubmit = async () => {
    const num = parseFloat(balanceAmount);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    if (!balanceReason.trim()) {
      toast.error("Please provide a reason for the adjustment");
      return;
    }

    setIsSubmittingBalance(true);
    try {
      const ok = await onAdjustBalance(user.id, num, balanceType, balanceReason.trim());
      if (ok) {
        setBalanceDialogOpen(false);
        setBalanceAmount("");
        setBalanceReason("");
        fetchUserHistory(user.id);
        onRefresh?.();
      }
    } finally {
      setIsSubmittingBalance(false);
    }
  };

  const handleProfitSubmit = async () => {
    const num = parseFloat(profitAmount);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    if (!profitReason.trim()) {
      toast.error("Please provide a reason for the adjustment");
      return;
    }

    setIsSubmittingProfit(true);
    try {
      const ok = await onAdjustProfit(user.id, num, profitType, profitReason.trim());
      if (ok) {
        setProfitDialogOpen(false);
        setProfitAmount("");
        setProfitReason("");
        fetchUserHistory(user.id);
        onRefresh?.();
      }
    } finally {
      setIsSubmittingProfit(false);
    }
  };

  const handleRankSubmit = async () => {
    if (!rankReason.trim()) {
      toast.error("Please provide a reason for updating the tier rank");
      return;
    }

    setIsSubmittingRank(true);
    try {
      const manualRankVal = selectedRank === "auto" ? null : selectedRank;
      const ok = await onSetRank(user.id, manualRankVal, rankReason.trim());
      if (ok) {
        setRankDialogOpen(false);
        setRankReason("");
        fetchUserHistory(user.id);
        onRefresh?.();
      }
    } finally {
      setIsSubmittingRank(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error("Please provide both title and message");
      return;
    }

    setIsSendingNotif(true);
    try {
      const ok = await onSendNotification(user.id, notifTitle.trim(), notifMessage.trim(), notifType);
      if (ok) {
        setNotifDialogOpen(false);
        setNotifTitle("");
        setNotifMessage("");
      }
    } finally {
      setIsSendingNotif(false);
    }
  };

  const rankBadgeColor = (rank?: string) => {
    switch (rank?.toLowerCase()) {
      case "gold":
        return "bg-gold/20 text-primary dark:text-gold border-gold/50";
      case "silver":
        return "bg-slate-300/40 text-slate-800 dark:text-slate-200 border-slate-500/50 dark:border-slate-400/40";
      case "bronze":
      default:
        return "bg-amber-700/20 text-amber-900 dark:text-amber-500 border-amber-600/50";
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-card p-6 border-border">
          <SheetHeader className="pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-gold" />
                  {user.full_name || "Unnamed Client"}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {user.email || "No email available"}
                </SheetDescription>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      user.status === "active"
                        ? "bg-teal/20 text-teal border-teal/40"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {user.status || "pending"}
                  </Badge>

                  {user.investing_frozen && (
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">
                      <Snowflake className="w-3 h-3 mr-1" /> Frozen
                    </Badge>
                  )}
                </div>

                <Badge variant="outline" className={rankBadgeColor(user.effective_rank || "bronze")}>
                  <Award className="w-3 h-3 mr-1" />
                  {(user.effective_rank || "bronze").toUpperCase()} TIER
                  {user.manual_rank && " (Manual Override)"}
                </Badge>
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Calendar className="w-3.5 h-3.5" />
              Client since: {user.created_at ? format(new Date(user.created_at), "PPP") : "N/A"}
            </div>
          </SheetHeader>

          {/* Financial Balances Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6">
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Main Balance</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-gold hover:text-gold-light hover:bg-gold/10"
                  onClick={() => setBalanceDialogOpen(true)}
                >
                  Adjust
                </Button>
              </div>
              <p className="text-lg font-bold text-foreground mt-1">
                ${(user.main_balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Profit Balance</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-teal hover:text-teal/80 hover:bg-teal/10"
                  onClick={() => setProfitDialogOpen(true)}
                >
                  Adjust
                </Button>
              </div>
              <p className="text-lg font-bold text-teal mt-1">
                ${(user.profit_balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border col-span-2 sm:col-span-1">
              <span className="text-xs text-muted-foreground">Active Invested</span>
              <p className="text-lg font-bold text-gold mt-1">
                ${activeInvestmentsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-card/60 border border-border/80">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowDownLeft className="w-3.5 h-3.5 text-teal" />
                Deposited
              </div>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                ${totalApprovedDeposits.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-card/60 border border-border/80">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                Withdrawn
              </div>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                ${totalApprovedWithdrawals.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-card/60 border border-border/80">
              <span className="text-xs text-muted-foreground">Investments Count</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {userInvestments.length} total
              </p>
            </div>
          </div>

          {/* Quick Management Actions Bar */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleFreeze(user.id, !user.investing_frozen)}
              className={
                user.investing_frozen
                  ? "border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  : "border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              }
            >
              {user.investing_frozen ? (
                <>
                  <Sun className="w-4 h-4 mr-1.5" /> Unfreeze Investing
                </>
              ) : (
                <>
                  <Snowflake className="w-4 h-4 mr-1.5" /> Freeze Investing
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setRankDialogOpen(true)}
              className="border-gold/40 text-gold hover:bg-gold/10"
            >
              <Award className="w-4 h-4 mr-1.5" /> Set Rank Tier
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotifDialogOpen(true)}
              className="border-primary/40 text-foreground hover:bg-secondary"
            >
              <Bell className="w-4 h-4 mr-1.5 text-gold" /> Send Notification
            </Button>
          </div>

          {/* Tabbed View: Investments, Transactions, Audit Log */}
          <Tabs defaultValue="investments" className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-secondary/80">
              <TabsTrigger value="investments">Investments ({userInvestments.length})</TabsTrigger>
              <TabsTrigger value="ledger">Ledger ({transactions.length})</TabsTrigger>
              <TabsTrigger value="audit">Audit Log ({auditLogs.length})</TabsTrigger>
            </TabsList>

            {/* Investments Tab */}
            <TabsContent value="investments" className="mt-4 space-y-3">
              {userInvestments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm border border-dashed rounded-xl">
                  No investments recorded for this user.
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bundle / Date</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Current / %</TableHead>
                        <TableHead>State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userInvestments.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {inv.bundle?.name || "Standard Portfolio"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {inv.created_at ? format(new Date(inv.created_at), "MMM d, yyyy") : ""}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ${(inv.initial_amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-teal">
                              ${(inv.current_value || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              +{inv.growth_percentage || 0}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <InvestmentStatusBadge status={inv.state} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Ledger Tab */}
            <TabsContent value="ledger" className="mt-4 space-y-3">
              {loadingHistory ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading ledger...</div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm border border-dashed rounded-xl">
                  No transaction records found in ledger.
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize font-mono">
                              {tx.tx_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ${(tx.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {tx.source || "system"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {tx.created_at ? format(new Date(tx.created_at), "MMM d, HH:mm") : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit" className="mt-4 space-y-3">
              {loadingHistory ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading audit log...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm border border-dashed rounded-xl">
                  No administrative actions logged for this client yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg bg-secondary/40 border border-border text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {log.created_at ? format(new Date(log.created_at), "MMM d, yyyy HH:mm") : ""}
                        </span>
                      </div>
                      {log.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong className="text-foreground">Reason:</strong> {log.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Adjust Main Balance Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Main Balance</DialogTitle>
            <DialogDescription>
              Add or deduct funds directly from the client&apos;s main account balance. An audit entry and ledger record will be immutably recorded.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={balanceType === "add" ? "default" : "outline"}
                className={balanceType === "add" ? "bg-teal hover:bg-teal/90 text-primary-foreground" : ""}
                onClick={() => setBalanceType("add")}
              >
                + Add Balance
              </Button>
              <Button
                type="button"
                variant={balanceType === "deduct" ? "destructive" : "outline"}
                onClick={() => setBalanceType("deduct")}
              >
                - Deduct Balance
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Adjustment Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason (Mandatory for audit trail)</Label>
              <Textarea
                placeholder="e.g. Deposit reconciliation / Compensation / Approved manual credit"
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBalanceSubmit}
              disabled={isSubmittingBalance}
              className="bg-gold hover:bg-gold-light text-navy font-semibold"
            >
              {isSubmittingBalance ? "Adjusting..." : "Confirm Balance Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Profit Balance Dialog */}
      <Dialog open={profitDialogOpen} onOpenChange={setProfitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Profit Balance</DialogTitle>
            <DialogDescription>
              Directly credit or debit the client&apos;s accrued profit balance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={profitType === "add" ? "default" : "outline"}
                className={profitType === "add" ? "bg-teal hover:bg-teal/90 text-primary-foreground" : ""}
                onClick={() => setProfitType("add")}
              >
                + Add Profit
              </Button>
              <Button
                type="button"
                variant={profitType === "deduct" ? "destructive" : "outline"}
                onClick={() => setProfitType("deduct")}
              >
                - Deduct Profit
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Adjustment Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={profitAmount}
                  onChange={(e) => setProfitAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason (Mandatory for audit trail)</Label>
              <Textarea
                placeholder="e.g. Yield bonus / Manual profit correction"
                value={profitReason}
                onChange={(e) => setProfitReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProfitSubmit}
              disabled={isSubmittingProfit}
              className="bg-teal hover:bg-teal/90 text-primary-foreground font-semibold"
            >
              {isSubmittingProfit ? "Adjusting..." : "Confirm Profit Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set User Rank Dialog */}
      <Dialog open={rankDialogOpen} onOpenChange={setRankDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User Rank Tier</DialogTitle>
            <DialogDescription>
              Set an explicit rank override or restore automatic dynamic rank calculation based on investment volume.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Select Tier Rank</Label>
              <Select value={selectedRank} onValueChange={setSelectedRank}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rank tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic (Dynamic Volume Calculation)</SelectItem>
                  <SelectItem value="bronze">Bronze ($0+ threshold)</SelectItem>
                  <SelectItem value="silver">Silver ($10,000+ threshold)</SelectItem>
                  <SelectItem value="gold">Gold ($50,000+ threshold)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason for override</Label>
              <Textarea
                placeholder="e.g. VIP client VIP fast-track / Manual promotion"
                value={rankReason}
                onChange={(e) => setRankReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRankDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRankSubmit}
              disabled={isSubmittingRank}
              className="bg-gold hover:bg-gold-light text-navy font-semibold"
            >
              {isSubmittingRank ? "Updating..." : "Save Rank Override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Targeted Notification Dialog */}
      <Dialog open={notifDialogOpen} onOpenChange={setNotifDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Targeted In-App Notification</DialogTitle>
            <DialogDescription>
              This notification will be delivered directly and exclusively to this client&apos;s notification feed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select value={notifType} onValueChange={setNotifType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="management">Management Update</SelectItem>
                  <SelectItem value="alert">Critical Alert</SelectItem>
                  <SelectItem value="reward">VIP Reward</SelectItem>
                  <SelectItem value="system">System Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Portfolio Status Update"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write message to client..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={isSendingNotif}
              className="bg-gold hover:bg-gold-light text-navy font-semibold"
            >
              {isSendingNotif ? "Sending..." : "Send Targeted Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
