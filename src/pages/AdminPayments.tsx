import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Menu, X, Bell, Search } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminPayments() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    payments, 
    stats, 
    loading, 
    approvePayment, 
    rejectPayment 
  } = useAdminData();

  const pendingPayments = payments.filter(p => p.status === "pending");
  const approvedPayments = payments.filter(p => p.status === "approved");
  const rejectedPayments = payments.filter(p => p.status === "rejected");

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
                  placeholder="Search payments..."
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
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Manage user payment submissions</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : (
            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending" className="relative">
                  Pending
                  {pendingPayments.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-gold text-primary-foreground text-xs">
                      {pendingPayments.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({approvedPayments.length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({rejectedPayments.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All ({payments.length})
                </TabsTrigger>
              </TabsList>

              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <TabsContent value="pending" className="m-0">
                  <PaymentsTable
                    payments={pendingPayments}
                    onApprove={approvePayment}
                    onReject={rejectPayment}
                    showAll
                  />
                </TabsContent>

                <TabsContent value="approved" className="m-0">
                  <PaymentsTable
                    payments={approvedPayments}
                    onApprove={approvePayment}
                    onReject={rejectPayment}
                    showAll
                  />
                </TabsContent>

                <TabsContent value="rejected" className="m-0">
                  <PaymentsTable
                    payments={rejectedPayments}
                    onApprove={approvePayment}
                    onReject={rejectPayment}
                    showAll
                  />
                </TabsContent>

                <TabsContent value="all" className="m-0">
                  <PaymentsTable
                    payments={payments}
                    onApprove={approvePayment}
                    onReject={rejectPayment}
                    showAll
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
