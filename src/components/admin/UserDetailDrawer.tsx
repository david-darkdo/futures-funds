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
        return "bg-gold/20 text-gold border-gold/40";
      case "silver":
        return "bg-slate-300/20 text-slate-200 border-slate-400/40";
      case "bronze":
      default:
        return "bg-amber-700/20 text-amber-500 border-amber-600/40";
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
                      {userInvestments.map((inv) => (\n                        <TableRow key={inv.id}>\n                          <TableCell>\n                            <div className=\"font-medium text-sm\">\n                              {inv.bundle?.name || \"Standard Portfolio\"}\n                            </div>\n                            <div className=\"text-xs text-muted-foreground\">\n                              {inv.created_at ? format(new Date(inv.created_at), \"MMM d, yyyy\") : \"\"}\n                            </div>\n                          </TableCell>\n                          <TableCell className=\"font-semibold\">\n                            ${(inv.initial_amount || 0).toLocaleString()}\n                          </TableCell>\n                          <TableCell>\n                            <div className=\"font-semibold text-teal\">\n                              ${(inv.current_value || 0).toLocaleString()}\n                            </div>\n                            <div className=\"text-xs text-muted-foreground\">\n                              +{inv.growth_percentage || 0}%\n                            </div>\n                          </TableCell>\n                          <TableCell>\n                            <InvestmentStatusBadge state={inv.state} />\n                          </TableCell>\n                        </TableRow>\n                      ))}\n                    </TableBody>\n                  </Table>\n                </div>\n              )}\n            </TabsContent>\n\n            {/* Ledger Tab */}\n            <TabsContent value=\"ledger\" className=\"mt-4 space-y-3\">\n              {loadingHistory ? (\n                <div className=\"p-8 text-center text-sm text-muted-foreground\">Loading ledger...</div>\n              ) : transactions.length === 0 ? (\n                <div className=\"p-8 text-center text-muted-foreground text-sm border border-dashed rounded-xl\">\n                  No transaction records found in ledger.\n                </div>\n              ) : (\n                <div className=\"border border-border rounded-xl overflow-hidden\">\n                  <Table>\n                    <TableHeader>\n                      <TableRow>\n                        <TableHead>Type</TableHead>\n                        <TableHead>Amount</TableHead>\n                        <TableHead>Source</TableHead>\n                        <TableHead>Date</TableHead>\n                      </TableRow>\n                    </TableHeader>\n                    <TableBody>\n                      {transactions.map((tx) => (\n                        <TableRow key={tx.id}>\n                          <TableCell>\n                            <Badge variant=\"outline\" className=\"text-xs capitalize font-mono\">\n                              {tx.tx_type}\n                            </Badge>\n                          </TableCell>\n                          <TableCell className=\"font-semibold\">\n                            ${(tx.amount || 0).toLocaleString(\"en-US\", { minimumFractionDigits: 2 })}\n                          </TableCell>\n                          <TableCell className=\"text-xs text-muted-foreground\">\n                            {tx.source || \"system\"}\n                          </TableCell>\n                          <TableCell className=\"text-xs text-muted-foreground whitespace-nowrap\">\n                            {tx.created_at ? format(new Date(tx.created_at), \"MMM d, HH:mm\") : \"\"}\n                          </TableCell>\n                        </TableRow>\n                      ))}\n                    </TableBody>\n                  </Table>\n                </div>\n              )}\n            </TabsContent>\n\n            {/* Audit Log Tab */}\n            <TabsContent value=\"audit\" className=\"mt-4 space-y-3\">\n              {loadingHistory ? (\n                <div className=\"p-8 text-center text-sm text-muted-foreground\">Loading audit log...</div>\n              ) : auditLogs.length === 0 ? (\n                <div className=\"p-8 text-center text-muted-foreground text-sm border border-dashed rounded-xl\">\n                  No administrative actions logged for this client yet.\n                </div>\n              ) : (\n                <div className=\"space-y-2\">\n                  {auditLogs.map((log) => (\n                    <div key={log.id} className=\"p-3 rounded-lg bg-secondary/40 border border-border text-sm\">\n                      <div className=\"flex items-center justify-between mb-1\">\n                        <Badge variant=\"outline\" className=\"font-mono text-xs\">\n                          {log.action}\n                        </Badge>\n                        <span className=\"text-xs text-muted-foreground\">\n                          {log.created_at ? format(new Date(log.created_at), \"MMM d, yyyy HH:mm\") : \"\"}\n                        </span>\n                      </div>\n                      {log.reason && (\n                        <p className=\"text-xs text-muted-foreground mt-1\">\n                          <strong className=\"text-foreground\">Reason:</strong> {log.reason}\n                        </p>\n                      )}\n                    </div>\n                  ))}\n                </div>\n              )}\n            </TabsContent>\n          </Tabs>\n        </SheetContent>\n      </Sheet>\n\n      {/* Adjust Main Balance Dialog */}\n      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>\n        <DialogContent className=\"sm:max-w-md\">\n          <DialogHeader>\n            <DialogTitle>Adjust Main Balance</DialogTitle>\n            <DialogDescription>\n              Add or deduct funds directly from the client&apos;s main account balance. An audit entry and ledger record will be immutably recorded.\n            </DialogDescription>\n          </DialogHeader>\n\n          <div className=\"space-y-4 py-3\">\n            <div className=\"grid grid-cols-2 gap-2\">\n              <Button\n                type=\"button\"\n                variant={balanceType === \"add\" ? \"default\" : \"outline\"}\n                className={balanceType === \"add\" ? \"bg-teal hover:bg-teal/90 text-primary-foreground\" : \"\"}\n                onClick={() => setBalanceType(\"add\")}\n              >\n                + Add Balance\n              </Button>\n              <Button\n                type=\"button\"\n                variant={balanceType === \"deduct\" ? \"destructive\" : \"outline\"}\n                onClick={() => setBalanceType(\"deduct\")}\n              >\n                - Deduct Balance\n              </Button>\n            </div>\n\n            <div className=\"space-y-2\">\n              <Label>Adjustment Amount (USD)</Label>\n              <div className=\"relative\">\n                <DollarSign className=\"absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground\" />\n                <Input\n                  type=\"number\"\n                  placeholder=\"0.00\"\n                  step=\"0.01\"\n                  min=\"0.01\"\n                  value={balanceAmount}\n                  onChange={(e) => setBalanceAmount(e.target.value)}\n                  className=\"pl-9\"\n                />\n              </div>\n            </div>\n\n            <div className=\"space-y-2\">\n              <Label>Reason (Mandatory for audit trail)</Label>\n              <Textarea\n                placeholder=\"e.g. Deposit reconciliation / Compensation / Approved manual credit\"\n                value={balanceReason}\n                onChange={(e) => setBalanceReason(e.target.value)}\n                rows={3}\n              />\n            </div>\n          </div>\n\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setBalanceDialogOpen(false)}>\n              Cancel\n            </Button>\n            <Button\n              onClick={handleBalanceSubmit}\n              disabled={isSubmittingBalance}\n              className=\"bg-gold hover:bg-gold-light text-navy font-semibold\"\n            >\n              {isSubmittingBalance ? \"Adjusting...\" : \"Confirm Balance Adjustment\"}\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n\n      {/* Adjust Profit Balance Dialog */}\n      <Dialog open={profitDialogOpen} onOpenChange={setProfitDialogOpen}>\n        <DialogContent className=\"sm:max-w-md\">\n          <DialogHeader>\n            <DialogTitle>Adjust Profit Balance</DialogTitle>\n            <DialogDescription>\n              Directly credit or debit the client&apos;s accrued profit balance.\n            </DialogDescription>\n          </DialogHeader>\n\n          <div className=\"space-y-4 py-3\">\n            <div className=\"grid grid-cols-2 gap-2\">\n              <Button\n                type=\"button\"\n                variant={profitType === \"add\" ? \"default\" : \"outline\"}\n                className={profitType === \"add\" ? \"bg-teal hover:bg-teal/90 text-primary-foreground\" : \"\"}\n                onClick={() => setProfitType(\"add\")}\n              >\n                + Add Profit\n              </Button>\n              <Button\n                type=\"button\"\n                variant={profitType === \"deduct\" ? \"destructive\" : \"outline\"}\n                onClick={() => setProfitType(\"deduct\")}\n              >\n                - Deduct Profit\n              </Button>\n            </div>\n\n            <div className=\"space-y-2\">\n              <Label>Adjustment Amount (USD)</Label>\n              <div className=\"relative\">\n                <DollarSign className=\"absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground\" />\n                <Input\n                  type=\"number\"\n                  placeholder=\"0.00\"\n                  step=\"0.01\"\n                  min=\"0.01\"\n                  value={profitAmount}\n                  onChange={(e) => setProfitAmount(e.target.value)}\n                  className=\"pl-9\"\n                />\n              </div>\n            </div>\n\n            <div className=\"space-y-2\">\n              <Label>Reason (Mandatory for audit trail)</Label>\n              <Textarea\n                placeholder=\"e.g. Yield bonus / Manual profit correction\"\n                value={profitReason}\n                onChange={(e) => setProfitReason(e.target.value)}\n                rows={3}\n              />\n            </div>\n          </div>\n\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setProfitDialogOpen(false)}>\n              Cancel\n            </Button>\n            <Button\n              onClick={handleProfitSubmit}\n              disabled={isSubmittingProfit}\n              className=\"bg-teal hover:bg-teal/90 text-primary-foreground font-semibold\"\n            >\n              {isSubmittingProfit ? \"Adjusting...\" : \"Confirm Profit Adjustment\"}\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n\n      {/* Set User Rank Dialog */}\n      <Dialog open={rankDialogOpen} onOpenChange={setRankDialogOpen}>\n        <DialogContent className=\"sm:max-w-md\">\n          <DialogHeader>\n            <DialogTitle>Manage User Rank Tier</DialogTitle>\n            <DialogDescription>\n              Set an explicit rank override or restore automatic dynamic rank calculation based on investment volume.\n            </DialogDescription>\n          </DialogHeader>\n\n          <div className=\"space-y-4 py-3\">\n            <div className=\"space-y-2\">\n              <Label>Select Tier Rank</Label>\n              <Select value={selectedRank} onValueChange={setSelectedRank}>\n                <SelectTrigger>\n                  <SelectValue placeholder=\"Select rank tier\" />\n                </SelectTrigger>\n                <SelectContent>\n                  <SelectItem value=\"auto\">Automatic (Dynamic Volume Calculation)</SelectItem>\n                  <SelectItem value=\"bronze\">Bronze ($0+ threshold)</SelectItem>\n                  <SelectItem value=\"silver\">Silver ($10,000+ threshold)</SelectItem>\n                  <SelectItem value=\"gold\">Gold ($50,000+ threshold)</SelectItem>\n                </SelectContent>\n              </Select>\n            </div>\n\n            <div className=\"space-y-2\">\n              <Label>Reason for override</Label>\n              <Textarea\n                placeholder=\"e.g. VIP client VIP fast-track / Manual promotion\"\n                value={rankReason}\n                onChange={(e) => setRankReason(e.target.value)}\n                rows={3}\n              />\n            </div>\n          </div>\n\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setRankDialogOpen(false)}>\n              Cancel\n            </Button>\n            <Button\n              onClick={handleRankSubmit}\n              disabled={isSubmittingRank}\n              className=\"bg-gold hover:bg-gold-light text-navy font-semibold\"\n            >\n              {isSubmittingRank ? \"Updating...\" : \"Save Rank Override\"}\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n\n      {/* Targeted Notification Dialog */}\n      <Dialog open={notifDialogOpen} onOpenChange={setNotifDialogOpen}>\n        <DialogContent className=\"sm:max-w-md\">\n          <DialogHeader>\n            <DialogTitle>Send Targeted In-App Notification</DialogTitle>\n            <DialogDescription>\n              This notification will be delivered directly and exclusively to this client&apos;s notification feed.\n            </DialogDescription>\n          </DialogHeader>\n\n          <div className=\"space-y-4 py-3\">\n            <div className=\"space-y-2\">\n              <Label>Notification Type</Label>\n              <Select value={notifType} onValueChange={setNotifType}>\n                <SelectTrigger>\n                  <SelectValue />\n                </SelectTrigger>\n                <SelectContent>\n                  <SelectItem value=\"management\">Management Update</SelectItem>\n                  <SelectItem value=\"alert\">Critical Alert</SelectItem>\n                  <SelectItem value=\"reward\">VIP Reward</SelectItem>\n                  <SelectItem value=\"system\">System Notice</SelectItem>\n                </SelectContent>\n              </Select>\n            </div>\n\n            <div className=\"space-y-2\">\n              <Label>Title</Label>\n              <Input\n                placeholder=\"e.g. Portfolio Status Update\"\n                value={notifTitle}\n                onChange={(e) => setNotifTitle(e.target.value)}\n              />\n            </div>\n\n            <div className=\"space-y-2\">\n              <Label>Message</Label>\n              <Textarea\n                placeholder=\"Write message to client...\"\n                value={notifMessage}\n                onChange={(e) => setNotifMessage(e.target.value)}\n                rows={4}\n              />\n            </div>\n          </div>\n\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setNotifDialogOpen(false)}>\n              Cancel\n            </Button>\n            <Button\n              onClick={handleSendNotification}\n              disabled={isSendingNotif}\n              className=\"bg-gold hover:bg-gold-light text-navy font-semibold\"\n            >\n              {isSendingNotif ? \"Sending...\" : \"Send Targeted Notification\"}\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n    </>\n  );\n}\n