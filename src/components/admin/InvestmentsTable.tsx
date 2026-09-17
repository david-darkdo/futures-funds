import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Search,
  Download,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Percent,
  AlertCircle,
  Clock,
} from "lucide-react";
import { maskEmail, cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { InvestmentStatusBadge } from "@/components/dashboard/InvestmentStatusBadge";
import { validateNumber, VALIDATION_LIMITS } from "@/lib/validation";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Bundle {
  id: string;
  name: string;
  price_usd: number;
}

export interface UserInvestment {
  id: string;
  user_id: string;
  bundle_id: string;
  payment_id?: string | null;
  state: string;
  initial_amount: number;
  current_value: number;
  growth_percentage: number;
  admin_note?: string | null;
  last_updated_by?: string | null;
  matures_at?: string | null;
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

interface InvestmentsTableProps {
  investments: UserInvestment[];
  onApplyGrowth: (
    investmentId: string,
    percentageChange: number,
    changeType: "growth" | "drawdown",
    note?: string
  ) => Promise<boolean>;
  onSettle: (investmentId: string, reason?: string) => Promise<boolean>;
  onPause: (investmentId: string, reason?: string) => Promise<boolean>;
  onResume: (investmentId: string, reason?: string) => Promise<boolean>;
  onAdjustRate: (investmentId: string, newPercentage: number, reason: string) => Promise<boolean>;
  onUpdateState?: (investmentId: string, newState: string, note?: string) => Promise<boolean>;
}

export function InvestmentsTable({
  investments,
  onApplyGrowth,
  onSettle,
  onPause,
  onResume,
  onAdjustRate,
}: InvestmentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvestment, setSelectedInvestment] = useState<UserInvestment | null>(null);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [growthDialogOpen, setGrowthDialogOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

  // Form states
  const [growthType, setGrowthType] = useState<"growth" | "drawdown">("growth");
  const [percentageChange, setPercentageChange] = useState("");
  const [newRate, setNewRate] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const filteredInvestments = investments.filter((inv) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      inv.profile?.full_name?.toLowerCase().includes(searchLower) ||
      inv.profile?.email?.toLowerCase().includes(searchLower) ||
      inv.bundle?.name?.toLowerCase().includes(searchLower) ||
      inv.state.toLowerCase().includes(searchLower)
    );
  });

  const resetForms = () => {
    setPercentageChange("");
    setNewRate("");
    setActionReason("");
    setSelectedInvestment(null);
  };

  // 1. Settle Action
  const handleSettle = async () => {
    if (!selectedInvestment) return;
    setProcessing(true);
    const success = await onSettle(selectedInvestment.id, actionReason || undefined);
    if (success) {
      setSettleDialogOpen(false);
      resetForms();
    }
    setProcessing(false);
  };

  // 2. Growth / Drawdown
  const handleApplyGrowth = async () => {
    if (!selectedInvestment || !percentageChange) return;
    const percentValidation = validateNumber(percentageChange, {
      fieldName: "Percentage change",
      min: VALIDATION_LIMITS.PERCENTAGE.MIN,
      max: VALIDATION_LIMITS.PERCENTAGE.MAX,
    });

    if (!percentValidation.isValid) {
      toast.error(percentValidation.error || "Invalid percentage");
      return;
    }

    setProcessing(true);
    const success = await onApplyGrowth(
      selectedInvestment.id,
      percentValidation.value,
      growthType,
      actionReason || undefined
    );
    if (success) {
      setGrowthDialogOpen(false);
      resetForms();
    }
    setProcessing(false);
  };

  // 3. Rate Adjustment
  const handleAdjustRate = async () => {
    if (!selectedInvestment || !newRate) return;
    const numRate = parseFloat(newRate);
    if (isNaN(numRate) || numRate < -100 || numRate > 1000) {
      toast.error("Please enter a valid rate between -100% and 1000%");
      return;
    }
    if (!actionReason.trim()) {
      toast.error("A reason is mandatory for adjusting the effective rate");
      return;
    }

    setProcessing(true);
    const success = await onAdjustRate(selectedInvestment.id, numRate, actionReason);
    if (success) {
      setRateDialogOpen(false);
      resetForms();
    }
    setProcessing(false);
  };

  // 4. Pause
  const handlePause = async () => {
    if (!selectedInvestment) return;
    setProcessing(true);
    const success = await onPause(selectedInvestment.id, actionReason || undefined);
    if (success) {
      setPauseDialogOpen(false);
      resetForms();
    }
    setProcessing(false);
  };

  // 5. Resume
  const handleResume = async () => {
    if (!selectedInvestment) return;
    setProcessing(true);
    const success = await onResume(selectedInvestment.id, actionReason || undefined);
    if (success) {
      setResumeDialogOpen(false);
      resetForms();
    }
    setProcessing(false);
  };

  const exportToCSV = () => {
    const headers = [
      "User",
      "Email",
      "Bundle",
      "Initial ($)",
      "Current ($)",
      "Profit ($)",
      "Rate (%)",
      "Status",
      "Started",
      "Maturity",
      "Completed",
    ];
    const rows = filteredInvestments.map((inv) => {
      const profit = Math.max(0, inv.current_value - inv.initial_amount);
      return [
        inv.profile?.full_name || "Unknown",
        inv.profile?.email || "",
        inv.bundle?.name || "Unknown",
        inv.initial_amount.toFixed(2),
        inv.current_value.toFixed(2),
        profit.toFixed(2),
        inv.growth_percentage.toFixed(2),
        inv.state,
        inv.created_at ? format(new Date(inv.created_at), "yyyy-MM-dd HH:mm") : "",
        inv.matures_at ? format(new Date(inv.matures_at), "yyyy-MM-dd HH:mm") : "N/A",
        inv.completed_at ? format(new Date(inv.completed_at), "yyyy-MM-dd HH:mm") : "N/A",
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `investments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <>
      {/* Search and Export Bar */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, email, bundle or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV} className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Bundle</TableHead>
              <TableHead>Initial</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Maturity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvestments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  No investments found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvestments.map((inv) => {
                const profit = Math.max(0, inv.current_value - inv.initial_amount);
                const isMatured = inv.matures_at ? new Date(inv.matures_at) <= new Date() : false;

                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{inv.profile?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{maskEmail(inv.profile?.email)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{inv.bundle?.name || "Custom"}</TableCell>
                    <TableCell className="text-muted-foreground">${inv.initial_amount.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold text-gold">
                      ${inv.current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-teal font-medium">
                      +${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <span className={cn("font-medium", inv.growth_percentage >= 0 ? "text-teal" : "text-destructive")}>
                        {inv.growth_percentage >= 0 ? "+" : ""}
                        {inv.growth_percentage.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {inv.matures_at ? (
                        <div className="text-xs">
                          {isMatured ? (
                            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                              Matured
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground" title={new Date(inv.matures_at).toLocaleString()}>
                              in {formatDistanceToNow(new Date(inv.matures_at))}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <InvestmentStatusBadge status={inv.state as any} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setSelectedInvestment(inv);
                            setViewDialogOpen(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* If Active or Paused -> Complete / Settle */}
                        {inv.state !== "completed" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-teal hover:text-teal hover:bg-teal/10"
                              onClick={() => {
                                setSelectedInvestment(inv);
                                setActionReason("");
                                setSettleDialogOpen(true);
                              }}
                              title="Settle & Complete Investment"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>

                            {/* Pause / Resume */}
                            {inv.state === "active" ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-500 hover:text-amber-500 hover:bg-amber-500/10"
                                onClick={() => {
                                  setSelectedInvestment(inv);
                                  setActionReason("");
                                  setPauseDialogOpen(true);
                                }}
                                title="Pause Investment"
                              >
                                <PauseCircle className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500 hover:text-blue-500 hover:bg-blue-500/10"
                                onClick={() => {
                                  setSelectedInvestment(inv);
                                  setActionReason("");
                                  setResumeDialogOpen(true);
                                }}
                                title="Resume Investment"
                              >
                                <PlayCircle className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Adjust Rate */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gold hover:text-gold hover:bg-gold/10"
                              onClick={() => {
                                setSelectedInvestment(inv);
                                setNewRate(inv.growth_percentage.toString());
                                setActionReason("");
                                setRateDialogOpen(true);
                              }}
                              title="Adjust Growth Rate %"
                            >
                              <Percent className="w-4 h-4" />
                            </Button>

                            {/* Apply Growth / Drawdown */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setSelectedInvestment(inv);
                                setGrowthType("growth");
                                setPercentageChange("");
                                setActionReason("");
                                setGrowthDialogOpen(true);
                              }}
                              title="Apply Growth or Drawdown"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-border">
        {filteredInvestments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No investments found</div>
        ) : (
          filteredInvestments.map((inv) => {
            const profit = Math.max(0, inv.current_value - inv.initial_amount);
            const isMatured = inv.matures_at ? new Date(inv.matures_at) <= new Date() : false;

            return (
              <div key={inv.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{inv.profile?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{maskEmail(inv.profile?.email)}</p>
                  </div>
                  <InvestmentStatusBadge status={inv.state as any} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm bg-secondary/30 p-3 rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground">Bundle</span>
                    <p className="font-medium">{inv.bundle?.name || "Custom"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Rate</span>
                    <p className={cn("font-medium", inv.growth_percentage >= 0 ? "text-teal" : "text-destructive")}>
                      {inv.growth_percentage >= 0 ? "+" : ""}{inv.growth_percentage.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Initial</span>
                    <p className="font-medium">${inv.initial_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Current</span>
                    <p className="font-semibold text-gold">${inv.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>
                    Maturity: {isMatured ? <strong className="text-amber-500">Matured</strong> : inv.matures_at ? formatDistanceToNow(new Date(inv.matures_at)) : "N/A"}
                  </span>
                  <span className="text-teal font-medium">+${profit.toFixed(2)} Profit</span>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setSelectedInvestment(inv);
                      setViewDialogOpen(true);
                    }}
                  >
                    Details
                  </Button>

                  {inv.state !== "completed" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs h-8 bg-teal hover:bg-teal/90 text-primary-foreground"
                        onClick={() => {
                          setSelectedInvestment(inv);
                          setActionReason("");
                          setSettleDialogOpen(true);
                        }}
                      >
                        Settle
                      </Button>

                      {inv.state === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-amber-500 border-amber-500/30"
                          onClick={() => {
                            setSelectedInvestment(inv);
                            setActionReason("");
                            setPauseDialogOpen(true);
                          }}
                        >
                          Pause
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-blue-500 border-blue-500/30"
                          onClick={() => {
                            setSelectedInvestment(inv);
                            setActionReason("");
                            setResumeDialogOpen(true);
                          }}
                        >
                          Resume
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 text-gold border-gold/30"
                        onClick={() => {
                          setSelectedInvestment(inv);
                          setNewRate(inv.growth_percentage.toString());
                          setActionReason("");
                          setRateDialogOpen(true);
                        }}
                      >
                        Rate %
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 1. SETTLEMENT CONFIRMATION DIALOG (Mandatory Phase 12) */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal">
              <CheckCircle2 className="w-5 h-5" />
              Complete & Settle Investment
            </DialogTitle>
            <DialogDescription>
              Execute atomic settlement. Principal will be returned to available balance and realized profit will be credited.
            </DialogDescription>
          </DialogHeader>

          {selectedInvestment && (() => {
            const principal = selectedInvestment.initial_amount;
            const profit = Math.max(0, selectedInvestment.current_value - principal);
            const total = principal + profit;

            return (
              <div className="space-y-4">
                <div className="rounded-xl bg-card border border-border p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span className="font-medium">{selectedInvestment.profile?.full_name || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bundle:</span>
                    <span className="font-medium">{selectedInvestment.bundle?.name || "Custom"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effective Rate:</span>
                    <span className="font-medium text-gold">{selectedInvestment.growth_percentage}%</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Principal Returned:</span>
                    <span className="font-semibold">${principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Realized Profit Credited:</span>
                    <span className="font-semibold text-teal">+${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-foreground">Total Settlement:</span>
                    <span className="font-bold text-gold">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settleReason">Settlement Note / Reason (optional)</Label>
                  <Textarea
                    id="settleReason"
                    placeholder="e.g. Completed after 24h maturity period"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-500 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Settlement is atomic and final. Protected against double-settlement. Ledgers and notifications will be created immediately.
                  </span>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              className="bg-teal hover:bg-teal/90 text-primary-foreground font-semibold"
              onClick={handleSettle}
              disabled={processing}
            >
              {processing ? "Settling..." : "Confirm & Settle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. RATE ADJUSTMENT DIALOG (Phase 8) */}
      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gold">
              <Percent className="w-5 h-5" />
              Adjust Effective Growth Rate
            </DialogTitle>
            <DialogDescription>
              Update the effective rate for this investment. Valuations will be recalculated immediately.
            </DialogDescription>
          </DialogHeader>

          {selectedInvestment && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Current Rate:</span> <strong>{selectedInvestment.growth_percentage}%</strong></p>
                <p><span className="text-muted-foreground">Initial Principal:</span> <strong>${selectedInvestment.initial_amount.toLocaleString()}</strong></p>
                {newRate && !isNaN(parseFloat(newRate)) && (
                  <p className="text-gold">
                    Projected Value: <strong>${(selectedInvestment.initial_amount * (1 + parseFloat(newRate) / 100)).toFixed(2)}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateInput">New Effective Rate (%)</Label>
                <Input
                  id="rateInput"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 25.0"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateReason">Reason for Rate Change (required)</Label>
                <Textarea
                  id="rateReason"
                  placeholder="e.g. Market intelligence adjustment approved by risk officer"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRateDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleAdjustRate} disabled={!newRate || !actionReason.trim() || processing}>
              {processing ? "Updating..." : "Update Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. PAUSE DIALOG (Phase 13) */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <PauseCircle className="w-5 h-5" />
              Pause Investment
            </DialogTitle>
            <DialogDescription>
              Temporarily halt growth accrual. Elapsed duration is frozen and maturity date will be automatically extended upon resumption.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pauseReason">Pause Reason (optional)</Label>
              <Textarea
                id="pauseReason"
                placeholder="e.g. Temporary security review"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handlePause} disabled={processing}>
              {processing ? "Pausing..." : "Pause Investment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. RESUME DIALOG (Phase 13) */}
      <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-500">
              <PlayCircle className="w-5 h-5" />
              Resume Investment
            </DialogTitle>
            <DialogDescription>
              Reactivate growth. The maturity date will be pushed forward by the exact duration this investment was paused.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resumeReason">Resume Note (optional)</Label>
              <Textarea
                id="resumeReason"
                placeholder="e.g. Account review completed"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResumeDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleResume} disabled={processing}>
              {processing ? "Resuming..." : "Resume Investment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. APPLY GROWTH/DRAWDOWN DIALOG */}
      <Dialog open={growthDialogOpen} onOpenChange={setGrowthDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {growthType === "growth" ? (
                <TrendingUp className="w-5 h-5 text-teal" />
              ) : (
                <TrendingDown className="w-5 h-5 text-destructive" />
              )}
              Apply {growthType === "growth" ? "Growth" : "Drawdown"}
            </DialogTitle>
            <DialogDescription>
              Adjust current investment valuation by a percentage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={growthType === "growth" ? "default" : "outline"}
                className={growthType === "growth" ? "bg-teal hover:bg-teal/90 text-primary-foreground" : ""}
                onClick={() => setGrowthType("growth")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Growth (+)
              </Button>
              <Button
                type="button"
                variant={growthType === "drawdown" ? "destructive" : "outline"}
                onClick={() => setGrowthType("drawdown")}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Drawdown (-)
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="growthPercent">Percentage Change (%)</Label>
              <Input
                id="growthPercent"
                type="number"
                step="0.01"
                placeholder="e.g. 5.5"
                value={percentageChange}
                onChange={(e) => setPercentageChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="growthNote">Note / Market Explanation</Label>
              <Textarea
                id="growthNote"
                placeholder="e.g. Market movement adjustment"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrowthDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              className={growthType === "growth" ? "bg-teal hover:bg-teal/90 text-primary-foreground" : "bg-destructive text-destructive-foreground"}
              onClick={handleApplyGrowth}
              disabled={!percentageChange || processing}
            >
              {processing ? "Applying..." : `Apply ${growthType === "growth" ? "Growth" : "Drawdown"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. VIEW DETAILS DIALOG */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Investment Details</DialogTitle>
            <DialogDescription>Full record for investment {selectedInvestment?.id}</DialogDescription>
          </DialogHeader>

          {selectedInvestment && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-card border border-border">
                <div>
                  <span className="text-xs text-muted-foreground">User</span>
                  <p className="font-semibold">{selectedInvestment.profile?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{maskEmail(selectedInvestment.profile?.email)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Status</span>
                  <div className="mt-1"><InvestmentStatusBadge status={selectedInvestment.state as any} size="sm" /></div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Initial Investment</span>
                  <p className="font-medium">${selectedInvestment.initial_amount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Current Value</span>
                  <p className="font-bold text-gold">${selectedInvestment.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Growth Rate</span>
                  <p className="font-medium text-teal">{selectedInvestment.growth_percentage}%</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Realized Profit</span>
                  <p className="font-medium text-teal">
                    +${Math.max(0, selectedInvestment.current_value - selectedInvestment.initial_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Started Date</span>
                  <p>{format(new Date(selectedInvestment.created_at), "yyyy-MM-dd HH:mm")}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Maturity Date</span>
                  <p>
                    {selectedInvestment.matures_at
                      ? format(new Date(selectedInvestment.matures_at), "yyyy-MM-dd HH:mm")
                      : "Not set"}
                  </p>
                </div>
                {selectedInvestment.completed_at && (
                  <div className="col-span-2 border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">Completed Date & Reason</span>
                    <p className="text-xs font-medium text-teal">
                      {format(new Date(selectedInvestment.completed_at), "yyyy-MM-dd HH:mm")}
                      {selectedInvestment.completion_reason ? ` — ${selectedInvestment.completion_reason}` : ""}
                    </p>
                  </div>
                )}
                {selectedInvestment.paused_at && (
                  <div className="col-span-2 border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">Paused Date & Reason</span>
                    <p className="text-xs font-medium text-amber-500">
                      {format(new Date(selectedInvestment.paused_at), "yyyy-MM-dd HH:mm")}
                      {selectedInvestment.pause_reason ? ` — ${selectedInvestment.pause_reason}` : ""}
                    </p>
                  </div>
                )}
                {selectedInvestment.admin_note && (
                  <div className="col-span-2 border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground">Management Note</span>
                    <p className="text-xs text-muted-foreground italic">{selectedInvestment.admin_note}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
