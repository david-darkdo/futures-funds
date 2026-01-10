import { Clock, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PendingPayment {
  id: string;
  bundle_id: string;
  crypto_amount: number | null;
  crypto_currency: string | null;
  status: string | null;
  created_at: string | null;
  bundle?: {
    name: string;
    price_usd: number;
  };
}

interface PendingInvestmentsCardProps {
  pendingPayments: PendingPayment[];
}

export function PendingInvestmentsCard({ pendingPayments }: PendingInvestmentsCardProps) {
  if (pendingPayments.length === 0) {
    return null;
  }

  const totalPendingAmount = pendingPayments.reduce(
    (sum, p) => sum + (p.bundle?.price_usd || 0),
    0
  );

  return (
    <Card className="bg-amber-500/5 border-amber-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-5 h-5 text-amber-500" />
          Pending Investments
          <Badge variant="outline" className="ml-auto border-amber-500/30 text-amber-500">
            Under Review
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          The following investments are awaiting management approval. Your active portfolio continues to grow normally.
        </p>
        
        <div className="space-y-3">
          {pendingPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">{payment.bundle?.name || "Investment Bundle"}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {payment.created_at ? format(new Date(payment.created_at), "MMM d, yyyy") : "—"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">${payment.bundle?.price_usd?.toLocaleString() || "—"}</p>
                <p className="text-xs text-amber-500">Pending</p>
              </div>
            </div>
          ))}
        </div>

        {pendingPayments.length > 1 && (
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Pending</span>
            <span className="font-semibold">${totalPendingAmount.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
