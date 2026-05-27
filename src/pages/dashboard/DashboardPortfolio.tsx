import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlaskConical, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMultiInvestment, generateChartDataFromMultiLogs } from "@/hooks/useMultiInvestment";
import { useTransactions, generateChartFromTransactions } from "@/hooks/useTransactions";
import { useDemoInvestment } from "@/hooks/useDemoInvestment";
import { HeroBalanceCard } from "@/components/dashboard/HeroBalanceCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PlansPreview } from "@/components/dashboard/PlansPreview";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { PendingInvestmentsCard } from "@/components/dashboard/PendingInvestmentsCard";
import { PaymentUploadDialog } from "@/components/payments/PaymentUploadDialog";
import { WithdrawalRequestDialog } from "@/components/payments/WithdrawalRequestDialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

function DemoStrip() {
  const { t } = useTranslation();
  const { demoInvestment, currentValue, deleteDemo, loading } = useDemoInvestment();
  const [deleting, setDeleting] = useState(false);
  const [openInvest, setOpenInvest] = useState(false);

  if (loading || !demoInvestment) return null;
  const profit = currentValue - demoInvestment.initial_amount;

  return (
    <Card className="border-gold/20 bg-gold/5">
      <CardContent className="p-4 flex items-center gap-3">
        <Badge variant="outline" className="border-gold/40 text-gold gap-1.5">
          <FlaskConical className="w-3 h-3" />
          Demo
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            ${currentValue.toFixed(2)}{" "}
            <span className={profit >= 0 ? "text-teal text-xs" : "text-destructive text-xs"}>
              {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground truncate">{demoInvestment.bundle?.name ?? "Demo"}</p>
        </div>
        <Button size="sm" variant="gold" onClick={() => setOpenInvest(true)}>
          {t("quickActions.invest")}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={async () => {
            setDeleting(true);
            await deleteDemo();
            setDeleting(false);
            toast({ title: "Demo removed" });
          }}
          disabled={deleting}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <PaymentUploadDialog open={openInvest} onOpenChange={setOpenInvest} />
      </CardContent>
    </Card>
  );
}

export default function DashboardPortfolio() {
  const { t } = useTranslation();
  const {
    activeInvestments,
    pendingPayments,
    portfolio,
    growthLogs,
    loading,
    hasActiveInvestment,
    hasPendingPayment,
  } = useMultiInvestment();
  const { transactions } = useTransactions();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  const chartData = useMemo(() => {
    if (transactions.length > 0) return generateChartFromTransactions(transactions);
    if (activeInvestments.length === 0) return [];
    const oldest = activeInvestments.reduce((o, inv) =>
      new Date(inv.created_at) < new Date(o.created_at) ? inv : o
    );
    return generateChartDataFromMultiLogs(portfolio.totalInitialAmount, oldest.created_at, growthLogs);
  }, [transactions, activeInvestments, portfolio.totalInitialAmount, growthLogs]);

  const profit = portfolio.totalCurrentValue - portfolio.totalInitialAmount;

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Hero balance */}
      <HeroBalanceCard
        mainBalance={portfolio.totalCurrentValue}
        invested={portfolio.totalInitialAmount}
        profit={profit}
        loading={loading}
        status={hasActiveInvestment ? "active" : hasPendingPayment ? "pending" : "inactive"}
      />

      {/* Quick actions */}
      <QuickActions
        onDeposit={() => setPaymentDialogOpen(true)}
        onWithdraw={() => setWithdrawalDialogOpen(true)}
        canWithdraw={hasActiveInvestment}
      />

      {/* Multi-bundle badge */}
      {portfolio.activeInvestmentsCount > 1 && (
        <Badge variant="outline" className="border-gold/30 text-gold gap-1">
          <Layers className="w-3 h-3" />
          {portfolio.activeInvestmentsCount} {t("nav.plans")}
        </Badge>
      )}

      {/* Demo strip if present */}
      <DemoStrip />

      {/* Pending payments */}
      {hasPendingPayment && <PendingInvestmentsCard pendingPayments={pendingPayments} />}

      {/* Performance chart */}
      {hasActiveInvestment && chartData.length > 1 && (
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-6">
          <PerformanceChart data={chartData} />
        </div>
      )}

      {/* Plans preview */}
      <PlansPreview />

      {/* Recent transactions */}
      <RecentTransactions />

      <PaymentUploadDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} />
      <WithdrawalRequestDialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        availableBalance={portfolio.totalCurrentValue}
      />
    </div>
  );
}
