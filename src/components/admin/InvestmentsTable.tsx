import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Edit, Eye, Search, Download } from "lucide-react";
import { maskEmail, cn } from "@/lib/utils";
import { format } from "date-fns";
import { InvestmentStatusBadge } from "@/components/dashboard/InvestmentStatusBadge";

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

interface UserInvestment {
  id: string;
  user_id: string;
  bundle_id: string;
  state: string;
  initial_amount: number;
  current_value: number;
  growth_percentage: number;
  admin_note: string | null;
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
  onUpdateState: (investmentId: string, newState: string, note?: string) => Promise<boolean>;
}

export function InvestmentsTable({
  investments,
  onApplyGrowth,
  onUpdateState,
}: InvestmentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvestment, setSelectedInvestment] = useState<UserInvestment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [growthDialogOpen, setGrowthDialogOpen] = useState(false);
  const [stateDialogOpen, setStateDialogOpen] = useState(false);
  const [growthType, setGrowthType] = useState<"growth" | "drawdown">("growth");
  const [percentageChange, setPercentageChange] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [newState, setNewState] = useState("");
  const [processing, setProcessing] = useState(false);

  const filteredInvestments = investments.filter((inv) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      inv.profile?.full_name?.toLowerCase().includes(searchLower) ||
      inv.profile?.email?.toLowerCase().includes(searchLower) ||
      inv.bundle?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleApplyGrowth = async () => {
    if (!selectedInvestment || !percentageChange) return;
    setProcessing(true);
    await onApplyGrowth(
      selectedInvestment.id,
      parseFloat(percentageChange),
      growthType,
      adminNote || undefined
    );
    setGrowthDialogOpen(false);
    resetForm();
    setProcessing(false);
  };

  const handleUpdateState = async () => {
    if (!selectedInvestment || !newState) return;
    setProcessing(true);
    await onUpdateState(selectedInvestment.id, newState, adminNote || undefined);
    setStateDialogOpen(false);
    resetForm();
    setProcessing(false);
  };

  const resetForm = () => {
    setPercentageChange("");
    setAdminNote("");
    setNewState("");
    setSelectedInvestment(null);
  };

  const exportToCSV = () => {
    const headers = [
      "User",
      "Email",
      "Bundle",
      "Initial Amount",
      "Current Value",
      "Growth %",
      "Status",
      "Created",
    ];
    const rows = filteredInvestments.map((inv) => [
      inv.profile?.full_name || "Unknown",
      inv.profile?.email || "",
      inv.bundle?.name || "Unknown",
      inv.initial_amount.toString(),
      inv.current_value.toFixed(2),
      inv.growth_percentage.toFixed(2),
      inv.state,
      inv.created_at ? format(new Date(inv.created_at), "yyyy-MM-dd") : "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `investments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const previewNewBalance = (current: number, percent: number, type: "growth" | "drawdown") => {
    const multiplier = type === "growth" ? 1 + percent / 100 : 1 - percent / 100;
    return current * multiplier;
  };

  return (
    <>
      {/* Search and Export */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or bundle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Bundle</TableHead>
              <TableHead>Initial</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Growth</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvestments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No investments found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvestments.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{inv.profile?.full_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {maskEmail(inv.profile?.email)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{inv.bundle?.name || "Unknown"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    ${inv.initial_amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-gold">
                    ${inv.current_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "font-medium",
                        inv.growth_percentage >= 0 ? "text-teal" : "text-destructive"
                      )}
                    >
                      {inv.growth_percentage >= 0 ? "+" : ""}
                      {inv.growth_percentage.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <InvestmentStatusBadge
                      status={inv.state as any}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedInvestment(inv);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-teal hover:text-teal hover:bg-teal/10"
                        onClick={() => {
                          setSelectedInvestment(inv);
                          setGrowthType("growth");
                          setGrowthDialogOpen(true);
                        }}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedInvestment(inv);
                          setGrowthType("drawdown");
                          setGrowthDialogOpen(true);
                        }}
                      >
                        <TrendingDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedInvestment(inv);
                          setNewState(inv.state);
                          setStateDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Investment Details</DialogTitle>
            <DialogDescription>View full investment information</DialogDescription>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedInvestment.profile?.full_name || "Unknown"}</p>
                  <p className="text-sm">{maskEmail(selectedInvestment.profile?.email)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bundle</p>
                  <p className="font-medium">{selectedInvestment.bundle?.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Initial</p>
                  <p className="font-medium">${selectedInvestment.initial_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current</p>
                  <p className="font-medium text-gold">
                    ${selectedInvestment.current_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Growth</p>
                  <p
                    className={cn(
                      "font-medium",
                      selectedInvestment.growth_percentage >= 0 ? "text-teal" : "text-destructive"
                    )}
                  >
                    {selectedInvestment.growth_percentage >= 0 ? "+" : ""}
                    {selectedInvestment.growth_percentage.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <InvestmentStatusBadge status={selectedInvestment.state as any} />
              </div>
              {selectedInvestment.admin_note && (
                <div>
                  <p className="text-sm text-muted-foreground">Admin Note</p>
                  <p className="text-sm">{selectedInvestment.admin_note}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {format(new Date(selectedInvestment.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm">
                    {format(new Date(selectedInvestment.updated_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
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

      {/* Apply Growth/Drawdown Dialog */}
      <Dialog open={growthDialogOpen} onOpenChange={setGrowthDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Apply {growthType === "growth" ? "Growth" : "Drawdown"}
            </DialogTitle>
            <DialogDescription>
              Enter the percentage to {growthType === "growth" ? "increase" : "decrease"} the investment value
            </DialogDescription>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <p className="text-xl font-bold text-gold">
                  ${selectedInvestment.current_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">Percentage Change (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.01"
                  placeholder="Enter percentage"
                  value={percentageChange}
                  onChange={(e) => setPercentageChange(e.target.value)}
                />
              </div>

              {percentageChange && (
                <div className="p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">New Balance Preview</p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      growthType === "growth" ? "text-teal" : "text-destructive"
                    )}
                  >
                    $
                    {previewNewBalance(
                      selectedInvestment.current_value,
                      parseFloat(percentageChange) || 0,
                      growthType
                    ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="note">Admin Note (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Add a note..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGrowthDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant={growthType === "growth" ? "default" : "destructive"}
              onClick={handleApplyGrowth}
              disabled={!percentageChange || processing}
            >
              {processing ? "Applying..." : `Apply ${growthType === "growth" ? "Growth" : "Drawdown"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update State Dialog */}
      <Dialog open={stateDialogOpen} onOpenChange={setStateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Investment State</DialogTitle>
            <DialogDescription>Change the investment status</DialogDescription>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New State</Label>
                <Select value={newState} onValueChange={setNewState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stateNote">Admin Note (optional)</Label>
                <Textarea
                  id="stateNote"
                  placeholder="Add a note about this state change..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateState} disabled={!newState || processing}>
              {processing ? "Updating..." : "Update State"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
