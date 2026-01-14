import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Eye, Clock, Copy } from "lucide-react";
import { maskEmail } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  network: string;
  currency: string;
  status: string;
  admin_note: string | null;
  txid: string | null;
  created_at: string;
  profile?: Profile;
}

interface WithdrawalsTableProps {
  withdrawals: Withdrawal[];
  onApprove: (id: string, txid?: string) => Promise<boolean>;
  onReject: (id: string, note?: string) => Promise<boolean>;
  showAll?: boolean;
}

export function WithdrawalsTable({ withdrawals, onApprove, onReject, showAll = false }: WithdrawalsTableProps) {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [txid, setTxid] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const displayWithdrawals = showAll ? withdrawals : withdrawals.filter(w => w.status === "pending");

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;
    setProcessing(true);
    await onApprove(selectedWithdrawal.id, txid);
    setTxid("");
    setApproveDialogOpen(false);
    setSelectedWithdrawal(null);
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;
    setProcessing(true);
    await onReject(selectedWithdrawal.id, rejectNote);
    setRejectNote("");
    setRejectDialogOpen(false);
    setSelectedWithdrawal(null);
    setProcessing(false);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal/10 text-teal border border-teal/20">
            <CheckCircle className="w-3 h-3" />
            Processed
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayWithdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No withdrawal requests found
                </TableCell>
              </TableRow>
            ) : (
              displayWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{withdrawal.profile?.full_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {maskEmail(withdrawal.profile?.email)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-gold">
                      ${withdrawal.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{withdrawal.currency}</p>
                  </TableCell>
                  <TableCell>{withdrawal.network}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm truncate max-w-[120px]">
                        {withdrawal.wallet_address}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyAddress(withdrawal.wallet_address)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(withdrawal.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {withdrawal.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-teal hover:text-teal hover:bg-teal/10"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setApproveDialogOpen(true);
                            }}
                            disabled={processing}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setRejectDialogOpen(true);
                            }}
                            disabled={processing}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
            <DialogDescription>
              Review the withdrawal request
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedWithdrawal.profile?.full_name || "Unknown"}</p>
                  <p className="text-sm">{maskEmail(selectedWithdrawal.profile?.email)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium text-gold">${selectedWithdrawal.amount.toLocaleString()}</p>
                  <p className="text-sm">{selectedWithdrawal.currency}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Network</p>
                <p className="font-medium">{selectedWithdrawal.network}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm break-all">{selectedWithdrawal.wallet_address}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => copyAddress(selectedWithdrawal.wallet_address)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {selectedWithdrawal.txid && (
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm break-all">{selectedWithdrawal.txid}</p>
                </div>
              )}
              {selectedWithdrawal.admin_note && (
                <div>
                  <p className="text-sm text-muted-foreground">Management Note</p>
                  <p className="text-sm">{selectedWithdrawal.admin_note}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(selectedWithdrawal.status)}
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

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription>
              Enter the transaction ID after sending funds
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWithdrawal && (
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-sm text-muted-foreground">Sending to:</p>
                <p className="font-mono text-sm break-all">{selectedWithdrawal.wallet_address}</p>
                <p className="text-gold font-medium mt-2">
                  ${selectedWithdrawal.amount.toLocaleString()} {selectedWithdrawal.currency}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="txid">Transaction ID (optional)</Label>
              <Input
                id="txid"
                placeholder="Enter transaction hash..."
                value={txid}
                onChange={(e) => setTxid(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleApprove} disabled={processing}>
              Approve & Mark Sent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this withdrawal
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
