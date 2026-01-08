import { useState } from "react";
import { Menu, Plus, ArrowDownToLine, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData, calculateGrowth } from "@/hooks/useDashboardData";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PaymentUploadDialog } from "@/components/payments/PaymentUploadDialog";
import { WithdrawalRequestDialog } from "@/components/payments/WithdrawalRequestDialog";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { profile, payments, activePayment, loading } = useDashboardData();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const growthData = activePayment?.bundle
    ? calculateGrowth(
        activePayment.bundle.price_usd,
        activePayment.bundle.daily_growth_rate || 0.5,
        activePayment.created_at || new Date().toISOString()
      )
    : { currentValue: 0 };

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
  const displayName = profile?.full_name || "Investor";

  // Determine page title based on route
  const getPageTitle = () => {
    if (location.pathname.includes("/start")) return "Get Started";
    if (location.pathname.includes("/pending")) return "Payment Status";
    if (location.pathname.includes("/transactions")) return "Transaction History";
    return "Portfolio Overview";
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={profile?.full_name || null}
        loading={loading}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-h-screen">
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
                <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
                {loading ? (
                  <Skeleton className="h-4 w-40 mt-1" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {displayName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="gold-outline"
                  size="sm"
                  onClick={() => setPaymentDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Investment
                </Button>
                {activePayment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawalDialogOpen(true)}
                    className="gap-2"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Withdraw
                  </Button>
                )}
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
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
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
