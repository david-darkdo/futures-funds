import { useState, useMemo } from "react";
import { Plus, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardData, calculateGrowth, generateGrowthChartData } from "@/hooks/useDashboardData";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { BundleGrowthPanel } from "@/components/dashboard/BundleGrowthPanel";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { ActivityTimeline, generateTimelineEvents } from "@/components/dashboard/ActivityTimeline";
import { MessagingPanel } from "@/components/dashboard/MessagingPanel";
import { PaymentUploadDialog } from "@/components/payments/PaymentUploadDialog";
import { WithdrawalRequestDialog } from "@/components/payments/WithdrawalRequestDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPortfolio() {
  const { payments, activePayment, loading } = useDashboardData();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  const growthData = useMemo(() => {
    if (!activePayment?.bundle) {
      return {
        currentValue: 0,
        growth: 0,
        growthPercent: 0,
        daysActive: 0
      };
    }

    return calculateGrowth(
      activePayment.bundle.price_usd,
      activePayment.bundle.daily_growth_rate || 0.5,
      activePayment.created_at || new Date().toISOString()
    );
  }, [activePayment]);

  const chartData = useMemo(() => {
    if (!activePayment?.bundle) {
      return [];
    }

    return generateGrowthChartData(
      activePayment.bundle.price_usd,
      activePayment.bundle.daily_growth_rate || 0.5,
      activePayment.created_at || new Date().toISOString()
    );
  }, [activePayment]);

  const timelineEvents = useMemo(() => {
    return generateTimelineEvents(payments, growthData.growthPercent);
  }, [payments, growthData.growthPercent]);

  if (loading) {
    return (
      <div className="flex-1 p-4 lg:p-8">
        <DashboardSummaryCards
          bundleName={null}
          investedAmount={0}
          currentValue={0}
          growthPercent={0}
          loading={true}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BundleGrowthPanel
              bundleName=""
              purchaseDate=""
              startingAmount={0}
              currentValue={0}
              growthAmount={0}
              growthPercent={0}
              dailyRate={0}
              status="pending"
              daysActive={0}
              loading={true}
            />
            <GrowthChart data={[]} loading={true} />
          </div>
          <div className="space-y-6">
            <ActivityTimeline events={[]} loading={true} />
            <MessagingPanel hasActiveInvestment={false} loading={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8">
      <div className="flex justify-end gap-2 mb-6 sm:hidden">
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

      <DashboardSummaryCards
        bundleName={activePayment?.bundle?.name || null}
        investedAmount={activePayment?.bundle?.price_usd || 0}
        currentValue={growthData.currentValue}
        growthPercent={growthData.growthPercent}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activePayment?.bundle && (
            <BundleGrowthPanel
              bundleName={activePayment.bundle.name}
              purchaseDate={activePayment.created_at || new Date().toISOString()}
              startingAmount={activePayment.bundle.price_usd}
              currentValue={growthData.currentValue}
              growthAmount={growthData.growth}
              growthPercent={growthData.growthPercent}
              dailyRate={activePayment.bundle.daily_growth_rate || 0.5}
              status="active"
              daysActive={growthData.daysActive}
            />
          )}

          {chartData.length > 0 && <GrowthChart data={chartData} />}
        </div>

        <div className="space-y-6">
          <ActivityTimeline events={timelineEvents} />
          <MessagingPanel hasActiveInvestment={true} />
        </div>
      </div>

      <PaymentUploadDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />

      <WithdrawalRequestDialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        availableBalance={growthData.currentValue}
      />
    </div>
  );
}
