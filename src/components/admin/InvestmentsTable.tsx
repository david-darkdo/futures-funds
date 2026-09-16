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
                        {inv.state !== "completed" && (\n                          <>\n                            <Button\n                              variant=\"ghost\"\n                              size=\"icon\"\n                              className=\"h-8 w-8 text-teal hover:text-teal hover:bg-teal/10\"\n                              onClick={() => {\n                                setSelectedInvestment(inv);\n                                setActionReason(\"\");\n                                setSettleDialogOpen(true);\n                              }}\n                              title=\"Settle & Complete Investment\"\n                            >\n                              <CheckCircle2 className=\"w-4 h-4\" />\n                            </Button>\n\n                            {/* Pause / Resume */}\n                            {inv.state === \"active\" ? (\n                              <Button\n                                variant=\"ghost\"\n                                size=\"icon\"\n                                className=\"h-8 w-8 text-amber-500 hover:text-amber-500 hover:bg-amber-500/10\"\n                                onClick={() => {\n                                  setSelectedInvestment(inv);\n                                  setActionReason(\"\");\n                                  setPauseDialogOpen(true);\n                                }}\n                                title=\"Pause Investment\"\n                              >\n                                <PauseCircle className=\"w-4 h-4\" />\n                              </Button>\n                            ) : (\n                              <Button\n                                variant=\"ghost\"\n                                size=\"icon\"\n                                className=\"h-8 w-8 text-blue-500 hover:text-blue-500 hover:bg-blue-500/10\"\n                                onClick={() => {\n                                  setSelectedInvestment(inv);\n                                  setActionReason(\"\");\n                                  setResumeDialogOpen(true);\n                                }}\n                                title=\"Resume Investment\"\n                              >\n                                <PlayCircle className=\"w-4 h-4\" />\n                              </Button>\n                            )}\n\n                            {/* Adjust Rate */}\n                            <Button\n                              variant=\"ghost\"\n                              size=\"icon\"\n                              className=\"h-8 w-8 text-gold hover:text-gold hover:bg-gold/10\"\n                              onClick={() => {\n                                setSelectedInvestment(inv);\n                                setNewRate(inv.growth_percentage.toString());\n                                setActionReason(\"\");\n                                setRateDialogOpen(true);\n                              }}\n                              title=\"Adjust Growth Rate %\"\n                            >\n                              <Percent className=\"w-4 h-4\" />\n                            </Button>\n\n                            {/* Apply Growth / Drawdown */}\n                            <Button\n                              variant=\"ghost\"\n                              size=\"icon\"\n                              className=\"h-8 w-8 text-muted-foreground hover:text-foreground\"\n                              onClick={() => {\n                                setSelectedInvestment(inv);\n                                setGrowthType(\"growth\");\n                                setPercentageChange(\"\");\n                                setActionReason(\"\");\n                                setGrowthDialogOpen(true);\n                              }}\n                              title=\"Apply Growth or Drawdown\"\n                            >\n                              <TrendingUp className=\"w-4 h-4\" />\n                            </Button>\n                          </>\n                        )}\n                      </div>\n                    </TableCell>\n                  </TableRow>\n                );\n              })\n            )}\n          </TableBody>\n        </Table>\n      </div>\n\n      {/* Mobile Card View */}\n      <div className=\"lg:hidden divide-y divide-border\">\n        {filteredInvestments.length === 0 ? (\n          <div className=\"text-center py-10 text-muted-foreground\">No investments found</div>\n        ) : (\n          filteredInvestments.map((inv) => {\n            const profit = Math.max(0, inv.current_value - inv.initial_amount);\n            const isMatured = inv.matures_at ? new Date(inv.matures_at) <= new Date() : false;\n\n            return (\n              <div key={inv.id} className=\"p-4 space-y-3\">\n                <div className=\"flex items-center justify-between\">\n                  <div>\n                    <p className=\"font-semibold text-foreground\">{inv.profile?.full_name || \"Unknown\"}</p>\n                    <p className=\"text-xs text-muted-foreground\">{maskEmail(inv.profile?.email)}</p>\n                  </div>\n                  <InvestmentStatusBadge status={inv.state as any} size=\"sm\" />\n                </div>\n\n                <div className=\"grid grid-cols-2 gap-2 text-sm bg-secondary/30 p-3 rounded-lg\">\n                  <div>\n                    <span className=\"text-xs text-muted-foreground\">Bundle</span>\n                    <p className=\"font-medium\">{inv.bundle?.name || \"Custom\"}</p>\n                  </div>\n                  <div>\n                    <span className=\"text-xs text-muted-foreground\">Rate</span>\n                    <p className={cn(\"font-medium\", inv.growth_percentage >= 0 ? \"text-teal\" : \"text-destructive\")}>\n                      {inv.growth_percentage >= 0 ? \"+\" : \"\"}{inv.growth_percentage.toFixed(2)}%\n                    </p>\n                  </div>\n                  <div>\n                    <span className=\"text-xs text-muted-foreground\">Initial</span>\n                    <p className=\"font-medium\">${inv.initial_amount.toLocaleString()}</p>\n                  </div>\n                  <div>\n                    <span className=\"text-xs text-muted-foreground\">Current</span>\n                    <p className=\"font-semibold text-gold\">${inv.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>\n                  </div>\n                </div>\n\n                <div className=\"flex items-center justify-between text-xs text-muted-foreground pt-1\">\n                  <span>\n                    Maturity: {isMatured ? <strong className=\"text-amber-500\">Matured</strong> : inv.matures_at ? formatDistanceToNow(new Date(inv.matures_at)) : \"N/A\"}\n                  </span>\n                  <span className=\"text-teal font-medium\">+${profit.toFixed(2)} Profit</span>\n                </div>\n\n                {/* Mobile Action Buttons */}\n                <div className=\"flex items-center gap-2 pt-2 flex-wrap\">\n                  <Button\n                    variant=\"outline\"\n                    size=\"sm\"\n                    className=\"text-xs h-8\"\n                    onClick={() => {\n                      setSelectedInvestment(inv);\n                      setViewDialogOpen(true);\n                    }}\n                  >\n                    Details\n                  </Button>\n\n                  {inv.state !== \"completed\" && (\n                    <>\n                      <Button\n                        variant=\"default\"\n                        size=\"sm\"\n                        className=\"text-xs h-8 bg-teal hover:bg-teal/90 text-primary-foreground\"\n                        onClick={() => {\n                          setSelectedInvestment(inv);\n                          setActionReason(\"\");\n                          setSettleDialogOpen(true);\n                        }}\n                      >\n                        Settle\n                      </Button>\n\n                      {inv.state === \"active\" ? (\n                        <Button\n                          variant=\"outline\"\n                          size=\"sm\"\n                          className=\"text-xs h-8 text-amber-500 border-amber-500/30\"\n                          onClick={() => {\n                            setSelectedInvestment(inv);\n                            setActionReason(\"\");\n                            setPauseDialogOpen(true);\n                          }}\n                        >\n                          Pause\n                        </Button>\n                      ) : (\n                        <Button\n                          variant=\"outline\"\n                          size=\"sm\"\n                          className=\"text-xs h-8 text-blue-500 border-blue-500/30\"\n                          onClick={() => {\n                            setSelectedInvestment(inv);\n                            setActionReason(\"\");\n                            setResumeDialogOpen(true);\n                          }}\n                        >\n                          Resume\n                        </Button>\n                      )}\n\n                      <Button\n                        variant=\"outline\"\n                        size=\"sm\"\n                        className=\"text-xs h-8 text-gold border-gold/30\"\n                        onClick={() => {\n                          setSelectedInvestment(inv);\n                          setNewRate(inv.growth_percentage.toString());\n                          setActionReason(\"\");\n                          setRateDialogOpen(true);\n                        }}\n                      >\n                        Rate %\n                      </Button>\n                    </>\n                  )}\n                </div>\n              </div>\n            );\n          })\n        )}\n      </div>\n\n      {/* 1. SETTLEMENT CONFIRMATION DIALOG (Mandatory Phase 12) */}\n      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>\n        <DialogContent className=\"max-w-md\">\n          <DialogHeader>\n            <DialogTitle className=\"flex items-center gap-2 text-teal\">\n              <CheckCircle2 className=\"w-5 h-5\" />\n              Complete & Settle Investment\n            </DialogTitle>\n            <DialogDescription>\n              Execute atomic settlement. Principal will be returned to available balance and realized profit will be credited.\n            </DialogDescription>\n          </DialogHeader>\n\n          {selectedInvestment && (() => {\n            const principal = selectedInvestment.initial_amount;\n            const profit = Math.max(0, selectedInvestment.current_value - principal);\n            const total = principal + profit;\n\n            return (\n              <div className=\"space-y-4\">\n                <div className=\"rounded-xl bg-card border border-border p-4 space-y-2 text-sm\">\n                  <div className=\"flex justify-between\">\n                    <span className=\"text-muted-foreground\">User:</span>\n                    <span className=\"font-medium\">{selectedInvestment.profile?.full_name || \"Unknown\"}</span>\n                  </div>\n                  <div className=\"flex justify-between\">\n                    <span className=\"text-muted-foreground\">Bundle:</span>\n                    <span className=\"font-medium\">{selectedInvestment.bundle?.name || \"Custom\"}</span>\n                  </div>\n                  <div className=\"flex justify-between\">\n                    <span className=\"text-muted-foreground\">Effective Rate:</span>\n                    <span className=\"font-medium text-gold\">{selectedInvestment.growth_percentage}%</span>\n                  </div>\n                  <div className=\"h-px bg-border my-2\" />\n                  <div className=\"flex justify-between\">\n                    <span className=\"text-muted-foreground\">Principal Returned:</span>\n                    <span className=\"font-semibold\">${principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>\n                  </div>\n                  <div className=\"flex justify-between\">\n                    <span className=\"text-muted-foreground\">Realized Profit Credited:</span>\n                    <span className=\"font-semibold text-teal\">+${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>\n                  </div>\n                  <div className=\"h-px bg-border my-2\" />\n                  <div className=\"flex justify-between text-base\">\n                    <span className=\"font-bold text-foreground\">Total Settlement:</span>\n                    <span className=\"font-bold text-gold\">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>\n                  </div>\n                </div>\n\n                <div className=\"space-y-2\">\n                  <Label htmlFor=\"settleReason\">Settlement Note / Reason (optional)</Label>\n                  <Textarea\n                    id=\"settleReason\"\n                    placeholder=\"e.g. Completed after 24h maturity period\"\n                    value={actionReason}\n                    onChange={(e) => setActionReason(e.target.value)}\n                    rows={2}\n                  />\n                </div>\n\n                <div className=\"flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-500 text-xs\">\n                  <AlertCircle className=\"w-4 h-4 shrink-0 mt-0.5\" />\n                  <span>\n                    Settlement is atomic and final. Protected against double-settlement. Ledgers and notifications will be created immediately.\n                  </span>\n                </div>\n              </div>\n            );\n          })()}\n\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setSettleDialogOpen(false)} disabled={processing}>\n              Cancel\n            </Button>\n            <Button\n              className=\"bg-teal hover:bg-teal/90 text-primary-foreground font-semibold\"\n              onClick={handleSettle}\n              disabled={processing}\n            >\n              {processing ? \"Settling...\" : \"Confirm & Settle\"}\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n\n      {/* 2. RATE ADJUSTMENT DIALOG (Phase 8) */}\n      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>\n        <DialogContent className=\"max-w-md\">\n          <DialogHeader>\n            <DialogTitle className=\"flex items-center gap-2 text-gold\">\n              <Percent className=\"w-5 h-5\" />\n              Adjust Effective Growth Rate\n            </DialogTitle>\n            <DialogDescription>\n              Update the effective rate for this investment. Valuations will be recalculated immediately.\n            </DialogDescription>\n          </DialogHeader>\n\n          {selectedInvestment && (\n            <div className=\"space-y-4\">\n              <div className=\"rounded-lg bg-secondary/50 p-3 text-sm space-y-1\">\n                <p><span className=\"text-muted-foreground\">Current Rate:</span> <strong>{selectedInvestment.growth_percentage}%</strong></p>\n                <p><span className=\"text-muted-foreground\">Initial Principal:</span> <strong>${selectedInvestment.initial_amount.toLocaleString()}</strong></p>\n                {newRate && !isNaN(parseFloat(newRate)) && (\n                  <p className=\"text-gold\">\n                    Projected Value: <strong>${(selectedInvestment.initial_amount * (1 + parseFloat(newRate) / 100)).toFixed(2)}</strong>\n                  </p>\n                )}\n              </div>\n\n              <div className=\"space-y-2\">\n                <Label htmlFor=\"rateInput\">New Effective Rate (%)</Label>\n                <Input\n                  id=\"rateInput\"\n                  type=\"number\"\n                  step=\"0.1\"\n                  placeholder=\"e.g. 25.0\"\n                  value={newRate}\n                  onChange={(e) => setNewRate(e.target.value)}\n                />\n              </div>\n\n              <div className=\"space-y-2\">\n                <Label htmlFor=\"rateReason\">Reason for Rate Change (required)</Label>\n                <Textarea\n                  id=\"rateReason\"\n                  placeholder=\"e.g. Market intelligence adjustment approved by risk officer\"\n                  value={actionReason}\n                  onChange={(e) => setActionReason(e.target.value)}\n                  rows={2}\n                />\n              </div>\n            </div>\n          )}\n\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setRateDialogOpen(false)} disabled={processing}>\n              Cancel\n            </Button>\n            <Button onClick={handleAdjustRate} disabled={!newRate || !actionReason.trim() || processing}>\n              {processing ? \"Updating...\" : \"Update Rate\"}\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n\n      {/* 3. PAUSE DIALOG (Phase 13) */}\n      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>\n        <DialogContent className=\"max-w-md\">\n          <DialogHeader>\n            <DialogTitle className=\"flex items-center gap-2 text-amber-500\">\n              <PauseCircle className=\"w-5 h-5\" />\n              Pause Investment\n            </DialogTitle>\n            <DialogDescription>\n              Temporarily halt growth accrual. Elapsed duration is frozen and maturity date will be automatically extended upon resumption.\n            </DialogDescription>\n          </DialogHeader>\n\n          <div className=\"space-y-4\">\n            <div className=\"space-y-2\">\n              <Label htmlFor=\"pauseReason\">Pause Reason (optional)</Label>\n              <Textarea\n                id=\"pauseReason\"\n                placeholder=\"e.g. Temporary security review\"\n                value={actionReason}\n                onChange={(e) => setActionReason(e.target.value)}\n                rows={2}\n              />\n            </div>\n          </div>\n\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setPauseDialogOpen(false)} disabled={processing}>\n              Cancel\n            </Button>\n            <Button variant=\"destructive\" onClick={handlePause} disabled={processing}>\n              {processing ? \"Pausing...\" : \"Pause Investment\"}\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n\n      {/* 4. RESUME DIALOG (Phase 13) */}\n      <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>\n        <DialogContent className=\"max-w-md\">\n          <DialogHeader>\n            <DialogTitle className=\"flex items-center gap-2 text-blue-500\">\n              <PlayCircle className=\"w-5 h-5\" />\n              Resume Investment\n            </DialogTitle>\n            <DialogDescription>\n              Reactivate growth. The maturity date will be pushed forward by the exact duration this investment was paused.\n            </DialogDescription>\n          </DialogHeader>\n\n          <div className=\"space-y-4\">\n            <div className=\"space-y-2\">\n              <Label htmlFor=\"resumeReason\">Resume Note (optional)</Label>\n              <Textarea\n                id=\"resumeReason\"\n                placeholder=\"e.g. Account review completed\"\n                value={actionReason}\n                onChange={(e) => setActionReason(e.target.value)}\n                rows={2}\n              />\n            </div>\n          </div>\n\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setResumeDialogOpen(false)} disabled={processing}>\n              Cancel\n            </Button>\n            <Button className=\"bg-blue-600 hover:bg-blue-700 text-white\" onClick={handleResume} disabled={processing}>\n              {processing ? \"Resuming...\" : \"Resume Investment\"}\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n\n      {/* 5. APPLY GROWTH/DRAWDOWN DIALOG */}\n      <Dialog open={growthDialogOpen} onOpenChange={setGrowthDialogOpen}>\n        <DialogContent className=\"max-w-md\">\n          <DialogHeader>\n            <DialogTitle className=\"flex items-center gap-2\">\n              {growthType === \"growth\" ? (\n                <TrendingUp className=\"w-5 h-5 text-teal\" />\n              ) : (\n                <TrendingDown className=\"w-5 h-5 text-destructive\" />\n              )}\n              Apply {growthType === \"growth\" ? \"Growth\" : \"Drawdown\"}\n            </DialogTitle>\n            <DialogDescription>\n              Adjust current investment valuation by a percentage.\n            </DialogDescription>\n          </DialogHeader>\n\n          <div className=\"space-y-4\">\n            <div className=\"grid grid-cols-2 gap-2\">\n              <Button\n                type=\"button\"\n                variant={growthType === \"growth\" ? \"default\" : \"outline\"}\n                className={growthType === \"growth\" ? \"bg-teal hover:bg-teal/90 text-primary-foreground\" : \"\"}\n                onClick={() => setGrowthType(\"growth\")}\n              >\n                <TrendingUp className=\"w-4 h-4 mr-2\" />\n                Growth (+)\n              </Button>\n              <Button\n                type=\"button\"\n                variant={growthType === \"drawdown\" ? \"destructive\" : \"outline\"}\n                onClick={() => setGrowthType(\"drawdown\")}\n              >\n                <TrendingDown className=\"w-4 h-4 mr-2\" />\n                Drawdown (-)\n              </Button>\n            </div>\n\n            <div className=\"space-y-2\">\n              <Label htmlFor=\"growthPercent\">Percentage Change (%)</Label>\n              <Input\n                id=\"growthPercent\"\n                type=\"number\"\n                step=\"0.01\"\n                placeholder=\"e.g. 5.5\"\n                value={percentageChange}\n                onChange={(e) => setPercentageChange(e.target.value)}\n              />\n            </div>\n\n            <div className=\"space-y-2\">\n              <Label htmlFor=\"growthNote\">Note / Market Explanation</Label>\n              <Textarea\n                id=\"growthNote\"\n                placeholder=\"e.g. Market movement adjustment\"\n                value={actionReason}\n                onChange={(e) => setActionReason(e.target.value)}\n                rows={2}\n              />\n            </div>\n          </div>\n\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setGrowthDialogOpen(false)} disabled={processing}>\n              Cancel\n            </Button>\n            <Button\n              className={growthType === \"growth\" ? \"bg-teal hover:bg-teal/90 text-primary-foreground\" : \"bg-destructive text-destructive-foreground\"}\n              onClick={handleApplyGrowth}\n              disabled={!percentageChange || processing}\n            >\n              {processing ? \"Applying...\" : `Apply ${growthType === \"growth\" ? \"Growth\" : \"Drawdown\"}`}\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n\n      {/* 6. VIEW DETAILS DIALOG */}\n      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>\n        <DialogContent className=\"max-w-lg\">\n          <DialogHeader>\n            <DialogTitle>Investment Details</DialogTitle>\n            <DialogDescription>Full record for investment {selectedInvestment?.id}</DialogDescription>\n          </DialogHeader>\n\n          {selectedInvestment && (\n            <div className=\"space-y-4 text-sm\">\n              <div className=\"grid grid-cols-2 gap-3 p-4 rounded-xl bg-card border border-border\">\n                <div>\n                  <span className=\"text-xs text-muted-foreground\">User</span>\n                  <p className=\"font-semibold\">{selectedInvestment.profile?.full_name || \"Unknown\"}</p>\n                  <p className=\"text-xs text-muted-foreground\">{maskEmail(selectedInvestment.profile?.email)}</p>\n                </div>\n                <div>\n                  <span className=\"text-xs text-muted-foreground\">Status</span>\n                  <div className=\"mt-1\"><InvestmentStatusBadge status={selectedInvestment.state as any} size=\"sm\" /></div>\n                </div>\n                <div>\n                  <span className=\"text-xs text-muted-foreground\">Initial Investment</span>\n                  <p className=\"font-medium\">${selectedInvestment.initial_amount.toLocaleString()}</p>\n                </div>\n                <div>\n                  <span className=\"text-xs text-muted-foreground\">Current Value</span>\n                  <p className=\"font-bold text-gold\">${selectedInvestment.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>\n                </div>\n                <div>\n                  <span className=\"text-xs text-muted-foreground\">Growth Rate</span>\n                  <p className=\"font-medium text-teal\">{selectedInvestment.growth_percentage}%</p>\n                </div>\n                <div>\n                  <span className=\"text-xs text-muted-foreground\">Realized Profit</span>\n                  <p className=\"font-medium text-teal\">\n                    +${Math.max(0, selectedInvestment.current_value - selectedInvestment.initial_amount).toFixed(2)}\n                  </p>\n                </div>\n                <div>\n                  <span className=\"text-xs text-muted-foreground\">Started Date</span>\n                  <p>{format(new Date(selectedInvestment.created_at), \"yyyy-MM-dd HH:mm\")}</p>\n                </div>\n                <div>\n                  <span className=\"text-xs text-muted-foreground\">Maturity Date</span>\n                  <p>\n                    {selectedInvestment.matures_at\n                      ? format(new Date(selectedInvestment.matures_at), \"yyyy-MM-dd HH:mm\")\n                      : \"Not set\"}\n                  </p>\n                </div>\n                {selectedInvestment.completed_at && (\n                  <div className=\"col-span-2 border-t border-border pt-2\">\n                    <span className=\"text-xs text-muted-foreground\">Completed Date & Reason</span>\n                    <p className=\"text-xs font-medium text-teal\">\n                      {format(new Date(selectedInvestment.completed_at), \"yyyy-MM-dd HH:mm\")}\n                      {selectedInvestment.completion_reason ? ` — ${selectedInvestment.completion_reason}` : \"\"}\n                    </p>\n                  </div>\n                )}\n                {selectedInvestment.paused_at && (\n                  <div className=\"col-span-2 border-t border-border pt-2\">\n                    <span className=\"text-xs text-muted-foreground\">Paused Date & Reason</span>\n                    <p className=\"text-xs font-medium text-amber-500\">\n                      {format(new Date(selectedInvestment.paused_at), \"yyyy-MM-dd HH:mm\")}\n                      {selectedInvestment.pause_reason ? ` — ${selectedInvestment.pause_reason}` : \"\"}\n                    </p>\n                  </div>\n                )}\n                {selectedInvestment.admin_note && (\n                  <div className=\"col-span-2 border-t border-border pt-2\">\n                    <span className=\"text-xs text-muted-foreground\">Management Note</span>\n                    <p className=\"text-xs text-muted-foreground italic\">{selectedInvestment.admin_note}</p>\n                  </div>\n                )}\n              </div>\n            </div>\n          )}\n\n          <DialogFooter>\n            <Button variant=\"outline\" onClick={() => setViewDialogOpen(false)}>\n              Close\n            </Button>\n          </DialogFooter>\n        </DialogContent>\n      </Dialog>\n    </>\n  );\n}\n