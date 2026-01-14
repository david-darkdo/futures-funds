import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu, X, Bell, Search } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { WalletManager } from "@/components/admin/WalletManager";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminWallets() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    wallets, 
    stats, 
    loading, 
    addWallet, 
    updateWallet, 
    deleteWallet 
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
                  placeholder="Search wallets..."
                  className="pl-10 w-64 bg-secondary border-border"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
                <span>Management</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Wallet Management</h1>
            <p className="text-muted-foreground">Configure crypto wallet addresses for payments</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border p-6">
              <WalletManager
                wallets={wallets}
                onAdd={addWallet}
                onUpdate={updateWallet}
                onDelete={deleteWallet}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
