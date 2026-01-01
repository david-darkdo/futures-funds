import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Menu, X, Bell, Search, TrendingUp } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { InvestmentsTable } from "@/components/admin/InvestmentsTable";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminInvestments() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    investments,
    stats,
    loading,
    applyGrowth,
    updateInvestmentState,
  } = useAdminData();

  const activeInvestments = investments.filter((i) => i.state === "active");
  const pausedInvestments = investments.filter((i) => i.state === "paused");
  const completedInvestments = investments.filter((i) => i.state === "completed");

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingPayments={stats.pendingPayments}
        pendingWithdrawals={stats.pendingWithdrawals}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-foreground"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search investments..."
                  className="pl-10 w-64 bg-secondary border-border"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                {stats.pendingPayments > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold" />
                )}
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
                <span>Admin</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-gold" />
              Investment Management
            </h1>
            <p className="text-muted-foreground">
              Apply growth or drawdown percentages to user investments
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm text-muted-foreground">Total Investments</p>
              <p className="text-2xl font-bold">{stats.totalInvestments}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-teal/20">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-teal">{activeInvestments.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-sm text-muted-foreground">Paused</p>
              <p className="text-2xl font-bold text-amber-500">{pausedInvestments.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : (
            <Tabs defaultValue="active" className="space-y-4">
              <TabsList>
                <TabsTrigger value="active" className="relative">
                  Active
                  {activeInvestments.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-teal text-primary-foreground text-xs">
                      {activeInvestments.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="paused">
                  Paused ({pausedInvestments.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedInvestments.length})
                </TabsTrigger>
                <TabsTrigger value="all">All ({investments.length})</TabsTrigger>
              </TabsList>

              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <TabsContent value="active" className="m-0">
                  <InvestmentsTable
                    investments={activeInvestments}
                    onApplyGrowth={applyGrowth}
                    onUpdateState={updateInvestmentState}
                  />
                </TabsContent>

                <TabsContent value="paused" className="m-0">
                  <InvestmentsTable
                    investments={pausedInvestments}
                    onApplyGrowth={applyGrowth}
                    onUpdateState={updateInvestmentState}
                  />
                </TabsContent>

                <TabsContent value="completed" className="m-0">
                  <InvestmentsTable
                    investments={completedInvestments}
                    onApplyGrowth={applyGrowth}
                    onUpdateState={updateInvestmentState}
                  />
                </TabsContent>

                <TabsContent value="all" className="m-0">
                  <InvestmentsTable
                    investments={investments}
                    onApplyGrowth={applyGrowth}
                    onUpdateState={updateInvestmentState}
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
