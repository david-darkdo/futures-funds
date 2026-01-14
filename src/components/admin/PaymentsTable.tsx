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
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Eye, Clock, ExternalLink } from "lucide-react";
import { maskEmail } from "@/lib/utils";
import { format } from "date-fns";

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

interface Payment {
  id: string;
  user_id: string;
  crypto_amount: number | null;
  crypto_currency: string | null;
  status: string | null;
  created_at: string | null;
  proof_url: string | null;
  txid: string | null;
  admin_note: string | null;
  profile?: Profile;
  bundle?: Bundle;
}

interface PaymentsTableProps {
  payments: Payment[];
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string, note?: string) => Promise<boolean>;
  showAll?: boolean;
}

export function PaymentsTable({ payments, onApprove, onReject, showAll = false }: PaymentsTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const displayPayments = showAll ? payments : payments.filter(p => p.status === "pending");

  const handleApprove = async (payment: Payment) => {
    setProcessing(true);
    await onApprove(payment.id);
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    setProcessing(true);
    await onReject(selectedPayment.id, rejectNote);
    setRejectNote("");
    setRejectDialogOpen(false);
    setSelectedPayment(null);
    setProcessing(false);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal/10 text-teal border border-teal/20">
            <CheckCircle className="w-3 h-3" />
            Approved
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
            Pending Review
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
              <TableHead>Bundle</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              displayPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.profile?.full_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {maskEmail(payment.profile?.email)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{payment.bundle?.name || "Unknown Bundle"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gold">
                        ${payment.bundle?.price_usd?.toLocaleString() || "0"}
                      </p>
                      {payment.crypto_amount && payment.crypto_currency && (
                        <p className="text-sm text-muted-foreground">
                          {payment.crypto_amount} {payment.crypto_currency}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.created_at
                      ? format(new Date(payment.created_at), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {payment.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-teal hover:text-teal hover:bg-teal/10"
                            onClick={() => handleApprove(payment)}
                            disabled={processing}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedPayment(payment);
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

      {/* View Payment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Review the payment submission details
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedPayment.profile?.full_name || "Unknown"}</p>
                  <p className="text-sm">{maskEmail(selectedPayment.profile?.email)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bundle</p>
                  <p className="font-medium">{selectedPayment.bundle?.name}</p>
                  <p className="text-sm text-gold">
                    ${selectedPayment.bundle?.price_usd?.toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedPayment.crypto_amount && (
                <div>
                  <p className="text-sm text-muted-foreground">Crypto Amount</p>
                  <p className="font-medium">
                    {selectedPayment.crypto_amount} {selectedPayment.crypto_currency}
                  </p>
                </div>
              )}
              {selectedPayment.txid && (
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm break-all">{selectedPayment.txid}</p>
                </div>
              )}
              {selectedPayment.proof_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Proof</p>
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img
                      src={selectedPayment.proof_url}
                      alt="Payment proof"
                      className="w-full max-h-64 object-contain bg-secondary"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden p-4 text-center">
                      <a
                        href={selectedPayment.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-gold hover:underline"
                      >
                        View Proof <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
              {selectedPayment.admin_note && (
                <div>
                  <p className="text-sm text-muted-foreground">Management Note</p>
                  <p className="text-sm">{selectedPayment.admin_note}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(selectedPayment.status)}
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

      {/* Reject Payment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment
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
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
