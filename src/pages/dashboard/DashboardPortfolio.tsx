import { useState, useMemo } from "react";
import { Plus, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserInvestment, generateChartDataFromLogs } from "@/hooks/useUserInvestment";
import { CapitalOverview } from "@/components/dashboard/CapitalOverview";
import { CircularGrowthIndicator } from "@/components/dashboard/CircularGrowthIndicator";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { ProfitTicker } from "@/components/dashboard/ProfitTicker";
import { ActivityTimeline, generateTimelineEvents } from "@/components/dashboard/ActivityTimeline";
import { MessagingPanel } from "@/components/dashboard/MessagingPanel";
import { PaymentUploadDialog } from "@/components/payments/PaymentUploadDialog";
import { WithdrawalRequestDialog } from "@/components/payments/WithdrawalRequestDialog";

export default function DashboardPortfolio() {
  const { investment, growthLogs, loading } = useUserInvestment();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  // Generate chart data from growth logs
  const chartData = useMemo(() => {
    if (!investment) return [];
    return generateChartDataFromLogs(
      investment.initial_amount,
      investment.created_at,
      growthLogs
    );
  }, [investment, growthLogs]);

  // Calculate daily change from most recent log
  const dailyChange = useMemo(() => {
    if (growthLogs.length === 0) return 0;
    const lastLog = growthLogs[growthLogs.length - 1];
    // Check if last log was today
    const today = new Date().toDateString();
    const logDate = new Date(lastLog.created_at).toDateString();
    if (today === logDate) {
      return lastLog.change_type === "growth" 
        ? lastLog.percentage_change 
        : -lastLog.percentage_change;
    }
    return 0;
  }, [growthLogs]);

  // Generate timeline events from growth logs
  const timelineEvents = useMemo(() => {
    if (!investment) return [];
    
    const events: Array<{
      id: string;
      type: "payment" | "growth" | "withdrawal" | "system";
      title: string;
      description: string;
      date: string;
      amount?: number;
    }> = [];

    // Add initial investment event
    events.push({
      id: "initial",
      type: "payment",
      title: "Investment Started",
      description: `Initial investment of $${investment.initial_amount.toLocaleString()}`,
      date: investment.created_at,
      amount: investment.initial_amount,
    });

    // Add growth log events
    growthLogs.forEach((log) => {
      events.push({
        id: log.id,
        type: log.change_type === "growth" ? "growth" : "system",
        title: log.change_type === "growth" ? "Growth Applied" : "Drawdown Applied",
        description: `${log.change_type === "growth" ? "+" : "-"}${log.percentage_change}% - Balance: $${log.balance_after.toLocaleString()}`,
        date: log.created_at,
        amount: log.balance_after - log.balance_before,
      });
    });

    return events.reverse(); // Most recent first
  }, [investment, growthLogs]);

  if (loading) {
    return (
      <div className="flex-1 p-4 lg:p-8 space-y-6">
        <CapitalOverview
          initialAmount={0}
          currentValue={0}
          status="no_investment"
          loading={true}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PerformanceChart data={[]} loading={true} />
          </div>
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

  if (!investment) {
    return (
      <div className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Active Investment</h2>
          <p className="text-muted-foreground mb-6">
            You don't have an active investment. Start one to see your portfolio.
          </p>
          <Button variant="gold" onClick={() => setPaymentDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Investment
          </Button>
        </div>
        <PaymentUploadDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8 space-y-6">
      {/* Mobile Action Buttons */}
      <div className="flex justify-end gap-2 sm:hidden">
        <Button
          variant="gold-outline"
          size="sm"
          onClick={() => setPaymentDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Investment
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWithdrawalDialogOpen(true)}
          className="gap-2"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Withdraw
        </Button>
      </div>

      {/* Capital Overview - Full Width */}
      <CapitalOverview
        initialAmount={investment.initial_amount}
        currentValue={investment.current_value}
        status={investment.state === "active" ? "active" : investment.state === "paused" ? "paused" : "pending"}
        bundleName={investment.bundle?.name}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart */}
        <div className="lg:col-span-2 space-y-6">
          <PerformanceChart data={chartData} />
          
          {/* Activity Timeline */}
          <div className="rounded-xl bg-card border border-border p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Activity</h3>
            {timelineEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet
              </p>
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
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Indicators */}
        <div className="space-y-6">
          {/* Circular Growth Indicator */}
          <div className="p-6 rounded-xl bg-card border border-border flex items-center justify-center">
            <CircularGrowthIndicator
              percentage={investment.growth_percentage}
              label="Total Growth"
            />
          </div>

          {/* Profit Ticker */}
          <ProfitTicker
            currentValue={investment.current_value}
            initialAmount={investment.initial_amount}
            dailyChange={dailyChange}
          />

          {/* Messaging Panel */}
          <MessagingPanel hasActiveInvestment={true} />
        </div>
      </div>

      {/* Dialogs */}
      <PaymentUploadDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />

      <WithdrawalRequestDialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        availableBalance={investment.current_value}
      />
    </div>
  );
}
