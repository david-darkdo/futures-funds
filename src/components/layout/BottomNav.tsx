import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, LayoutGrid, Layers, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (p: string) => boolean;
  highlight?: boolean;
}

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname;

  // Hide on auth pages
  if (path === "/login" || path === "/signup" || path.startsWith("/admin")) {
    return null;
  }

  const items: Item[] = [
    { to: "/", label: t("bottomNav.home", "Home"), icon: Home, match: (p) => p === "/" },
    {
      to: "/dashboard",
      label: t("bottomNav.dashboard", "Dashboard"),
      icon: LayoutGrid,
      match: (p) => p.startsWith("/dashboard") && !p.startsWith("/dashboard/settings"),
    },
    {
      to: "/plans",
      label: t("bottomNav.plans", "Plans"),
      icon: Layers,
      match: (p) => p.startsWith("/plans"),
      highlight: true,
    },
    {
      to: "/dashboard/settings",
      label: t("bottomNav.profile", "Profile"),
      icon: User,
      match: (p) => p.startsWith("/dashboard/settings"),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-lg border-t border-gold/20 rounded-t-2xl shadow-[0_-8px_32px_-8px_hsla(0,0%,0%,0.5)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4 max-w-md mx-auto px-2 py-2">
        {items.map(({ to, label, icon: Icon, match, highlight }) => {
          const active = match(path);
          if (highlight) {
            return (
              <li key={to} className="flex justify-center">
                <NavLink
                  to={to}
                  className="flex flex-col items-center gap-1 -mt-6"
                  aria-label={label}
                >
                  <span
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all",
                      active
                        ? "bg-gradient-to-br from-gold-light to-gold-dark border-gold shadow-[0_8px_24px_-4px_hsla(42,52%,54%,0.6)]"
                        : "bg-gradient-to-br from-gold to-gold-dark border-gold/60 shadow-[0_6px_20px_-6px_hsla(42,52%,54%,0.5)] hover:from-gold-light"
                    )}
                  >
                    <Icon className="w-6 h-6 text-navy" />
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold tracking-wide",
                      active ? "text-gold" : "text-foreground/80"
                    )}
                  >
                    {label}
                  </span>
                </NavLink>
              </li>
            );
          }
          return (
            <li key={to} className="flex justify-center">
              <NavLink
                to={to}
                className="flex flex-col items-center gap-1 py-1 px-3 transition-colors"
                aria-label={label}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    active ? "text-gold" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] transition-colors",
                    active ? "text-gold font-semibold" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
