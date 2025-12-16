import { useState, useMemo } from "react";
import { Menu, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, maskEmail } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData, calculateGrowth, generateGrowthChartData } from "@/hooks/useDashboardData";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { BundleGrowthPanel } from "@/components/dashboard/BundleGrowthPanel";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { ActivityTimeline, generateTimelineEvents } from "@/components/dashboard/ActivityTimeline";
import { MessagingPanel } from "@/components/dashboard/MessagingPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, payments, activePayment, loading } = useDashboardData();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Calculate growth data
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

  // Generate chart data
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

  // Generate timeline events
  const timelineEvents = useMemo(() => {
    return generateTimelineEvents(payments, growthData.growthPercent);
  }, [payments, growthData.growthPercent]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return "text-teal bg-teal/10 border-teal/20";
      case "pending":
        return "text-gold bg-gold/10 border-gold/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return CheckCircle;
      case "pending":
        return Clock;
      default:
        return AlertCircle;
    }
  };

  const accountStatus = activePayment ? "active" : payments.length > 0 ? "pending" : "inactive";
  const StatusIcon = getStatusIcon(accountStatus);
  const displayName = profile?.full_name || maskEmail(profile?.email) || "Investor";

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={profile?.full_name || null}
        userEmail={profile?.email || null}
        loading={loading}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-foreground"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">Dashboard</h1>
                {loading ? (
                  <Skeleton className="h-4 w-40 mt-1" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {displayName}
                  </p>
                )}
              </div>
            </div>

            <div
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2",
                getStatusColor(accountStatus)
              )}
            >
              <StatusIcon className="w-4 h-4" />
              <span className="capitalize">{accountStatus}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {loading ? (
            <>
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
            </>
          ) : !activePayment && payments.length === 0 ? (
            <EmptyState />
          ) : (
            <>
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
                      status={activePayment.status === "approved" ? "active" : "pending"}
                      daysActive={growthData.daysActive}
                    />
                  )}

                  {chartData.length > 0 && <GrowthChart data={chartData} />}
                </div>

                <div className="space-y-6">
                  <ActivityTimeline events={timelineEvents} />
                  <MessagingPanel hasActiveInvestment={!!activePayment} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}