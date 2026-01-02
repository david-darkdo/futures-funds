import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Menu,
  X,
  Bell,
  Search,
  Users,
  Clock,
  Package,
  TrendingUp,
  ArrowDownToLine,
  DollarSign
} from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    payments, 
    investments,
    stats, 
    loading, 
    approvePayment, 
    rejectPayment 
  } = useAdminData();

  const pendingPayments = payments.filter(p => p.status === "pending");

  // Calculate total capital under management
  const totalCapital = useMemo(() => {
    return investments
      .filter(i => i.state === "active")
      .reduce((sum, i) => sum + i.current_value, 0);
  }, [investments]);

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingPayments={stats.pendingPayments}
        pendingWithdrawals={stats.pendingWithdrawals}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-foreground"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              {/* Search */}
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users, payments..."
                  className="pl-10 w-64 bg-secondary border-border"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                {stats.pendingPayments > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold" />
                )}
              </button>
              
              {/* Admin Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
                <span>Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {loading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </>
            ) : (
              <>
                <div className="p-6 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                
                <div className="p-6 rounded-xl bg-card border border-gold/20">
                  <div className="flex items-center justify-between mb-4">
                    <Clock className="w-5 h-5 text-gold" />
                    {stats.pendingPayments > 0 && (
                      <span className="text-xs text-gold">Needs Action</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gold">{stats.pendingPayments}</p>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                </div>
                
                <div className="p-6 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-5 h-5 text-teal" />
                  </div>
                  <p className="text-2xl font-bold text-teal">{stats.activeInvestments}</p>
                  <p className="text-sm text-muted-foreground">Active Investments</p>
                </div>

                <div className="p-6 rounded-xl bg-card border border-teal/20">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-5 h-5 text-teal" />
                  </div>
                  <p className="text-2xl font-bold text-teal">
                    ${totalCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Capital</p>
                </div>
                
                <div className="p-6 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <ArrowDownToLine className="w-5 h-5 text-muted-foreground" />
                    {stats.pendingWithdrawals > 0 && (
                      <span className="text-xs text-gold">Needs Action</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
                  <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
                </div>
              </>
            )}
          </div>

          {/* Pending Payments Table */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pending Payments</h3>
                <p className="text-sm text-muted-foreground">Review and approve user deposits</p>
              </div>
              <Button variant="gold-outline" size="sm" asChild>
                <Link to="/admin/payments">View All</Link>
              </Button>
            </div>
            
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <PaymentsTable
                payments={pendingPayments.slice(0, 5)}
                onApprove={approvePayment}
                onReject={rejectPayment}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
