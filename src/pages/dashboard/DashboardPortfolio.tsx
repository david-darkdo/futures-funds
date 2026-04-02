import { useState, useMemo } from "react";
import { Plus, ArrowDownToLine, Layers, FlaskConical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMultiInvestment, generateChartDataFromMultiLogs } from "@/hooks/useMultiInvestment";
import { useTransactions, generateChartFromTransactions, calculatePortfolioMetrics } from "@/hooks/useTransactions";
import { useDemoInvestment } from "@/hooks/useDemoInvestment";
import { CapitalOverview } from "@/components/dashboard/CapitalOverview";
import { CircularGrowthIndicator } from "@/components/dashboard/CircularGrowthIndicator";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ProfitTicker } from "@/components/dashboard/ProfitTicker";
import { MessagingPanel } from "@/components/dashboard/MessagingPanel";
import { PendingInvestmentsCard } from "@/components/dashboard/PendingInvestmentsCard";
import { PaymentUploadDialog } from "@/components/payments/PaymentUploadDialog";
import { WithdrawalRequestDialog } from "@/components/payments/WithdrawalRequestDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

function DemoPortfolioSection() {
  const {
    demoInvestment,
    currentValue,
    growthPercentage,
    chartData,
    timelineEvents,
    dailyChange,
    deleteDemo,
    loading: demoLoading,
  } = useDemoInvestment();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (demoLoading) return null;
  if (!demoInvestment) return null;

  const handleWithdraw = () => {
    toast({
      title: "Ready to invest for real? 🚀",
      description: "Create your first real investment to start earning with actual funds!",
    });
    setPaymentDialogOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteDemo();
    setDeleting(false);
    toast({ title: "Demo investment removed" });
  };

  return (
    <div className="space-y-6">
      {/* Demo Badge Header */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="border-gold/40 text-gold gap-1.5 px-3 py-1">
          <FlaskConical className="w-3.5 h-3.5" />
          Demo Investment
        </Badge>
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="text-muted-foreground hover:text-destructive gap-1 text-xs">
          <Trash2 className="w-3.5 h-3.5" />
          Remove Demo
        </Button>
      </div>

      <CapitalOverview
        initialAmount={demoInvestment.initial_amount}
        currentValue={currentValue}
        status="active"
        bundleName={`${demoInvestment.bundle?.name ?? "Standard Plan"} (Demo)`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PerformanceChart data={chartData} />

          {/* Demo Activity Timeline */}
          <div className="rounded-xl bg-card border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Demo Activity</h3>
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-4">
                {timelineEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.type === "growth" ? "bg-teal" :
                      event.type === "payment" ? "bg-gold" : "bg-muted-foreground"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-card border border-border flex items-center justify-center">
            <CircularGrowthIndicator percentage={growthPercentage} label="Demo Growth" />
          </div>
          <ProfitTicker currentValue={currentValue} initialAmount={demoInvestment.initial_amount} dailyChange={dailyChange} />

          {/* Demo messaging */}
          <Card className="border-gold/20 bg-gold/5">
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm font-medium">🎯 Like what you see?</p>
              <p className="text-xs text-muted-foreground">This is a simulation. Create a real investment to start earning actual returns.</p>
              <Button variant="gold" size="sm" className="w-full gap-2" onClick={handleWithdraw}>
                <Plus className="w-4 h-4" />
                Invest for Real
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentUploadDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} />
    </div>
  );
}

export default function DashboardPortfolio() {
  const {
    activeInvestments,
    pendingPayments,
    portfolio,
    growthLogs,
    loading,
    hasActiveInvestment,
    hasPendingPayment
  } = useMultiInvestment();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { hasDemoInvestment } = useDemoInvestment();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  // Generate chart data from transactions (preferred) or growth logs (fallback)
  const chartData = useMemo(() => {
    if (transactions.length > 0) {
      return generateChartFromTransactions(transactions);
    }
    if (activeInvestments.length === 0) return [];
    const oldestInvestment = activeInvestments.reduce((oldest, inv) =>
      new Date(inv.created_at) < new Date(oldest.created_at) ? inv : oldest
    );
    return generateChartDataFromMultiLogs(
      portfolio.totalInitialAmount,
      oldestInvestment.created_at,
      growthLogs
    );
  }, [transactions, activeInvestments, portfolio.totalInitialAmount, growthLogs]);

  const metrics = useMemo(() => calculatePortfolioMetrics(transactions), [transactions]);

  const dailyChange = useMemo(() => {
    if (growthLogs.length === 0) return 0;
    const lastLog = growthLogs[growthLogs.length - 1];
    const today = new Date().toDateString();
    const logDate = new Date(lastLog.created_at).toDateString();
    if (today === logDate) {
      return lastLog.change_type === "growth" ? lastLog.percentage_change : -lastLog.percentage_change;
    }
    return 0;
  }, [growthLogs]);

  const timelineEvents = useMemo(() => {
    if (activeInvestments.length === 0) return [];
    const events: Array<{ id: string; type: "payment" | "growth" | "withdrawal" | "system"; title: string; description: string; date: string; amount?: number }> = [];
    activeInvestments.forEach((inv) => {
      events.push({
        id: `initial-${inv.id}`, type: "payment",
        title: inv.bundle?.name ? `${inv.bundle.name} Activated` : "Investment Started",
        description: `Investment of $${inv.initial_amount.toLocaleString()}`,
        date: inv.created_at, amount: inv.initial_amount,
      });
    });
    growthLogs.forEach((log) => {
      events.push({
        id: log.id, type: log.change_type === "growth" ? "growth" : "system",
        title: "Company Performance Update",
        description: `${log.change_type === "growth" ? "+" : "-"}${log.percentage_change}% - Balance: $${log.balance_after.toLocaleString()}`,
        date: log.created_at, amount: log.balance_after - log.balance_before,
      });
    });
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeInvestments, growthLogs]);

  if (loading) {
    return (
      <div className="flex-1 p-4 lg:p-8 space-y-6">
        <CapitalOverview initialAmount={0} currentValue={0} status="no_investment" loading={true} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><PerformanceChart data={[]} loading={true} /></div>
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-card border border-border flex items-center justify-center">
              <CircularGrowthIndicator percentage={0} loading={true} />
            </div>
            <ProfitTicker currentValue={0} initialAmount={0} loading={true} />
          </div>
        </div>
      </div>
    );
  }

  // No real investment — show demo only (or empty state)
  if (!hasActiveInvestment) {
    if (hasDemoInvestment) {
      return (
        <div className="flex-1 p-4 lg:p-8 space-y-6">
          <DemoPortfolioSection />
        </div>
      );
    }

    return (
      <div className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Active Investment</h2>
          <p className="text-muted-foreground mb-6">You don't have an active investment. Start one to see your portfolio.</p>
          <Button variant="gold" onClick={() => setPaymentDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />New Investment
          </Button>
        </div>
        <PaymentUploadDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} />
      </div>
    );
  }

  const bundleDisplayName = portfolio.activeInvestmentsCount > 1
    ? `${portfolio.primaryBundleName || "Investment Bundle"} +${portfolio.activeInvestmentsCount - 1} more`
    : (portfolio.primaryBundleName || "Investment Bundle");

  return (
    <div className="flex-1 p-4 lg:p-8 space-y-6">
      {/* Mobile Action Buttons */}
      <div className="flex justify-end gap-2 sm:hidden">
        <Button variant="gold-outline" size="sm" onClick={() => setPaymentDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />New Investment
        </Button>
        <Button variant="outline" size="sm" onClick={() => setWithdrawalDialogOpen(true)} className="gap-2">
          <ArrowDownToLine className="w-4 h-4" />Withdraw
        </Button>
      </div>

      {/* Capital Overview */}
      <div className="relative">
        <CapitalOverview
          initialAmount={portfolio.totalInitialAmount}
          currentValue={portfolio.totalCurrentValue}
          status="active"
          bundleName={bundleDisplayName}
        />
        {portfolio.activeInvestmentsCount > 1 && (
          <Badge variant="outline" className="absolute top-4 right-4 border-gold/30 text-gold gap-1">
            <Layers className="w-3 h-3" />{portfolio.activeInvestmentsCount} Active Bundles
          </Badge>
        )}
      </div>

      {hasPendingPayment && <PendingInvestmentsCard pendingPayments={pendingPayments} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PerformanceChart data={chartData} />
          <div className="rounded-xl bg-card border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Activity</h3>
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-4">
                {timelineEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.type === "growth" ? "bg-teal" : event.type === "payment" ? "bg-gold" : "bg-muted-foreground"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-card border border-border flex items-center justify-center">
            <CircularGrowthIndicator percentage={portfolio.totalGrowthPercentage} label="Total Growth" />
          </div>
          <ProfitTicker currentValue={portfolio.totalCurrentValue} initialAmount={portfolio.totalInitialAmount} dailyChange={dailyChange} />
          <MessagingPanel hasActiveInvestment={true} />
        </div>
      </div>

      {/* Demo section below real portfolio */}
      {hasDemoInvestment && <DemoPortfolioSection />}

      <PaymentUploadDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} />
      <WithdrawalRequestDialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen} availableBalance={portfolio.totalCurrentValue} />
    </div>
  );
}
