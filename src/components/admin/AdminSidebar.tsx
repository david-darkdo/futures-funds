import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  LayoutDashboard, 
  CreditCard,
  Users,
  Package, 
  Settings, 
  LogOut,
  Wallet,
  X,
  ArrowDownToLine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pendingPayments: number;
  pendingWithdrawals: number;
}

const adminSidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Payments", href: "/admin/payments", icon: CreditCard, countKey: "payments" as const },
  { name: "Investments", href: "/admin/investments", icon: TrendingUp },
  { name: "Withdrawals", href: "/admin/withdrawals", icon: ArrowDownToLine, countKey: "withdrawals" as const },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Bundles", href: "/admin/bundles", icon: Package },
  { name: "Wallets", href: "/admin/wallets", icon: Wallet },
];

export function AdminSidebar({ isOpen, onClose, pendingPayments, pendingWithdrawals }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getCounts = (countKey?: "payments" | "withdrawals") => {
    if (countKey === "payments") return pendingPayments;
    if (countKey === "withdrawals") return pendingWithdrawals;
    return 0;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-display font-bold text-foreground block">
                  Future<span className="text-gold">Funds</span>
                </span>
                <span className="text-xs text-muted-foreground">Management Panel</span>
              </div>
            </Link>
            <button onClick={onClose} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {adminSidebarLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const count = link.countKey ? getCounts(link.countKey) : 0;

              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
                    isActive && "bg-secondary text-foreground"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.name}</span>
                  {count > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-gold text-primary-foreground text-xs font-bold">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
