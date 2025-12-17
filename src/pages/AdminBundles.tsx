import { useState } from "react";
import { Menu, X, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BundlesManager } from "@/components/admin/BundlesManager";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminBundles() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    bundles,
    stats,
    loading,
    addBundle,
    updateBundle,
    deleteBundle,
  } = useAdminData();

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-foreground"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Bundle Management</h1>
                <p className="text-sm text-muted-foreground">
                  Configure investment bundles and growth rates
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : (
            <BundlesManager
              bundles={bundles}
              onAdd={addBundle}
              onUpdate={updateBundle}
              onDelete={deleteBundle}
            />
          )}
        </main>
      </div>
    </div>
  );
}
