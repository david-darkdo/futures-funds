import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  LayoutDashboard, 
  CreditCard,
  Users,
  Package, 
  Activity, 
  Settings, 
  LogOut,
  Wallet,
  Menu,
  X,
  Bell,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const adminSidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Bundles", href: "/admin/bundles", icon: Package },
  { name: "Activity Log", href: "/admin/activity", icon: Activity },
  { name: "Wallets", href: "/admin/wallets", icon: Wallet },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

// Mock data
const mockStats = {
  totalUsers: 1247,
  pendingPayments: 23,
  activeSubscriptions: 892,
  monthlyPurchases: 156,
};

const mockPendingPayments = [
  { id: 1, user: "john@example.com", bundle: "Professional", amount: "$2,500", date: "2024-01-15", status: "pending" },
  { id: 2, user: "jane@example.com", bundle: "Starter", amount: "$500", date: "2024-01-15", status: "pending" },
  { id: 3, user: "mike@example.com", bundle: "Institutional", amount: "$10,000", date: "2024-01-14", status: "pending" },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-display font-bold text-foreground block">
                  Future<span className="text-gold">Funds</span>
                </span>
                <span className="text-xs text-muted-foreground">Admin Panel</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {adminSidebarLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
                  link.href === "/admin" && "bg-secondary text-foreground"
                )}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.name}</span>
                {link.name === "Payments" && mockStats.pendingPayments > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-gold text-primary-foreground text-xs font-bold">
                    {mockStats.pendingPayments}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={() => navigate("/")}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
                {mockStats.pendingPayments > 0 && (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-teal">+12%</span>
              </div>
              <p className="text-2xl font-bold">{mockStats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-gold/20">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-5 h-5 text-gold" />
                <span className="text-xs text-gold">Needs Action</span>
              </div>
              <p className="text-2xl font-bold text-gold">{mockStats.pendingPayments}</p>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-teal">+8%</span>
              </div>
              <p className="text-2xl font-bold">{mockStats.activeSubscriptions}</p>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-teal">+24%</span>
              </div>
              <p className="text-2xl font-bold">{mockStats.monthlyPurchases}</p>
              <p className="text-sm text-muted-foreground">Monthly Purchases</p>
            </div>
          </div>

          {/* Pending Payments Table */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pending Payments</h3>
                <p className="text-sm text-muted-foreground">Review and approve user payments</p>
              </div>
              <Button variant="gold-outline" size="sm" asChild>
                <Link to="/admin/payments">View All</Link>
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Bundle</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPendingPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="p-4">
                        <span className="text-sm">{payment.user}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{payment.bundle}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium text-gold">{payment.amount}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{payment.date}</span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-teal hover:text-teal hover:bg-teal/10">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
