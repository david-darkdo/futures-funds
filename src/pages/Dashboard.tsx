import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  LayoutDashboard, 
  Package, 
  Upload, 
  History, 
  Settings, 
  LogOut,
  Menu,
  X,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Bundles", href: "/dashboard/bundles", icon: Package },
  { name: "Upload Payment", href: "/dashboard/upload", icon: Upload },
  { name: "Transactions", href: "/dashboard/transactions", icon: History },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

// Mock user data - will be replaced with real data
const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  status: "active",
  bundle: "Professional",
  paymentStatus: "approved",
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return "text-teal bg-teal/10 border-teal/20";
      case "pending":
        return "text-gold bg-gold/10 border-gold/20";
      case "rejected":
      case "inactive":
        return "text-destructive bg-destructive/10 border-destructive/20";
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

  const StatusIcon = getStatusIcon(mockUser.status);

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
              <span className="text-xl font-display font-bold text-foreground">
                Future<span className="text-gold">Funds</span>
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
                  link.href === "/dashboard" && "bg-secondary text-foreground"
                )}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.name}</span>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-foreground"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div>
                <h1 className="text-xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {mockUser.name}</p>
              </div>
            </div>
            
            <div className={cn("px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2", getStatusColor(mockUser.status))}>
              <StatusIcon className="w-4 h-4" />
              <span className="capitalize">{mockUser.status}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Welcome Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-gold/10 via-card to-card border border-gold/20 mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
              Welcome back, <span className="text-gradient-gold">{mockUser.name}</span>
            </h2>
            <p className="text-muted-foreground mb-6">
              Your investment dashboard is ready. Monitor your portfolio and manage your investments.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="gold" asChild>
                <Link to="/dashboard/bundles">
                  View Bundles
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button variant="glass" asChild>
                <Link to="/dashboard/upload">Upload Payment</Link>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Active Bundle */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-gold" />
                </div>
                <span className="text-sm text-muted-foreground">Active Bundle</span>
              </div>
              <p className="text-2xl font-bold">{mockUser.bundle || "None"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {mockUser.bundle ? "Your current investment plan" : "No active bundle"}
              </p>
            </div>

            {/* Payment Status */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-teal" />
                </div>
                <span className="text-sm text-muted-foreground">Payment Status</span>
              </div>
              <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border", getStatusColor(mockUser.paymentStatus))}>
                <CheckCircle className="w-4 h-4" />
                <span className="capitalize">{mockUser.paymentStatus}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Last updated: Just now</p>
            </div>

            {/* Account Status */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-gold" />
                </div>
                <span className="text-sm text-muted-foreground">Account Status</span>
              </div>
              <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border", getStatusColor(mockUser.status))}>
                <StatusIcon className="w-4 h-4" />
                <span className="capitalize">{mockUser.status}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Your account is fully verified</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity to display</p>
                <p className="text-sm mt-1">Your transaction history will appear here</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
