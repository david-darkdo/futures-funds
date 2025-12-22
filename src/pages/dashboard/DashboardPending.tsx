import { useState, useEffect } from "react";
import { Clock, CheckCircle2, Upload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentUploadDialog } from "@/components/payments/PaymentUploadDialog";
import { format } from "date-fns";

interface PendingPayment {
  id: string;
  bundle_id: string;
  crypto_amount: number | null;
  crypto_currency: string | null;
  proof_url: string | null;
  created_at: string | null;
  bundle?: {
    name: string;
    price_usd: number;
  };
}

export default function DashboardPending() {
  const { user } = useAuth();
  const [payment, setPayment] = useState<PendingPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchPendingPayment = async () => {
      setLoading(true);
      
      const { data: paymentData } = await supabase
        .from("payments")
        .select("id, bundle_id, crypto_amount, crypto_currency, proof_url, created_at")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentData) {
        const { data: bundleData } = await supabase
          .from("bundles")
          .select("name, price_usd")
          .eq("id", paymentData.bundle_id)
          .maybeSingle();

        setPayment({
          ...paymentData,
          bundle: bundleData || undefined
        });
      }

      setLoading(false);
    };

    fetchPendingPayment();
  }, [user]);

  const steps = [
    {
      title: "Payment Submitted",
      description: "Your payment has been received",
      completed: true
    },
    {
      title: "Under Review",
      description: "Our team is verifying your payment",
      completed: false,
      active: true
    },
    {
      title: "Investment Active",
      description: "Your investment will start growing",
      completed: false
    }
  ];

  if (loading) {
    return (
      <div className="flex-1 p-4 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/20 mb-6 animate-pulse">
            <Clock className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Payment Under Review
          </h1>
          <p className="text-muted-foreground text-lg">
            Your payment is being verified by our team. This usually takes 1-24 hours.
          </p>
        </div>

        {payment && (
          <Card className="bg-card/50 border-border/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-gold animate-spin" style={{ animationDuration: '3s' }} />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bundle</p>
                  <p className="font-medium">{payment.bundle?.name || "Investment Bundle"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    ${payment.bundle?.price_usd.toLocaleString() || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Crypto Sent</p>
                  <p className="font-medium">
                    {payment.crypto_amount ? `${payment.crypto_amount} ${payment.crypto_currency}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {payment.created_at ? format(new Date(payment.created_at), "MMM d, yyyy") : "—"}
                  </p>
                </div>
              </div>

              {!payment.proof_url && (
                <div className="pt-4 border-t border-border">
                  <Button
                    variant="gold-outline"
                    size="sm"
                    onClick={() => setPaymentDialogOpen(true)}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Proof of Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Verification Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        step.completed
                          ? "bg-teal/10 border-teal text-teal"
                          : step.active
                          ? "bg-gold/10 border-gold text-gold"
                          : "bg-muted border-border text-muted-foreground"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : step.active ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-8 ${
                          step.completed ? "bg-teal" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pt-2">
                    <p className={`font-medium ${step.active ? "text-gold" : ""}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <PaymentUploadDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />
    </div>
  );
}
