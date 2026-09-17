import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { UsersTable } from "@/components/admin/UsersTable";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminUsers() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profiles, stats, loading, updateUserStatus, toggleInvestingFreeze } = useAdminData();

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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">User Management</h1>
                  <p className="text-sm text-muted-foreground">
                    {profiles.length} registered users
                  </p>
                </div>
              </div>
            </div>

            <Link to="/admin/user-state">
              <Button size="sm" className="bg-gold hover:bg-gold-light text-navy font-semibold gap-1.5">
                <Shield className="w-4 h-4" />
                User State Center
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full max-w-sm" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : (
            <UsersTable profiles={profiles} onUpdateStatus={updateUserStatus} onToggleFreeze={toggleInvestingFreeze} />
          )}
        </main>
      </div>
    </div>
  );
}
