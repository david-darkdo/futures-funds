import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Rocket,
  Clock,
  Briefcase,
  LogOut,
  X,
  LockKeyhole,
  Home,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserState, UserDashboardState } from "@/hooks/useUserState";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string | null;
  loading?: boolean;
  onSignOut: () => void;
}

const sidebarLinks: {
  name: string;
  href: string;
  icon: typeof Rocket;
  allowedStates: UserDashboardState[];
  external?: boolean;
}[] = [
  {
    name: "Homepage",
    href: "/",
    icon: Home,
    allowedStates: ["start", "pending", "portfolio", "loading"],
    external: true,
  },
  { 
    name: "Get Started", 
    href: "/dashboard/start", 
    icon: Rocket,
    allowedStates: ["start"]
  },
  { 
    name: "Payment Status", 
    href: "/dashboard/pending", 
    icon: Clock,
    allowedStates: ["pending"]
  },
  { 
    name: "My Portfolio", 
    href: "/dashboard/portfolio", 
    icon: Briefcase,
    allowedStates: ["portfolio"]
  },
  { 
    name: "Transaction History", 
    href: "/dashboard/transactions", 
    icon: Receipt,
    allowedStates: ["portfolio"]
  },
];

export function DashboardSidebar({
  isOpen,
  onClose,
  userName,
  loading = false,
  onSignOut
}: DashboardSidebarProps) {
  const location = useLocation();
  const { state: userState, loading: stateLoading } = useUserState();
  const displayName = userName || "User";

  const isLinkActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const isLinkAccessible = (allowedStates: UserDashboardState[]) => {
    if (stateLoading) return true;
    return allowedStates.includes(userState);
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

      {/* Sidebar */}
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
              <span className="text-xl font-display font-bold text-foreground">
                Future<span className="text-gold">Funds</span>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            {loading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-gold font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-foreground truncate">{displayName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              const isAccessible = link.external || isLinkAccessible(link.allowedStates);
              
              return (
                <div key={link.name} className="relative">
                  {isAccessible ? (
                    <Link
                      to={link.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        isActive && !link.external
                          ? "bg-gold/10 text-gold border border-gold/20" 
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <link.icon className="w-5 h-5" />
                      <span className="font-medium">{link.name}</span>
                    </Link>
                  ) : (
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground/50 cursor-not-allowed"
                    >
                      <link.icon className="w-5 h-5" />
                      <span className="font-medium">{link.name}</span>
                      <LockKeyhole className="w-4 h-4 ml-auto" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={onSignOut}
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
