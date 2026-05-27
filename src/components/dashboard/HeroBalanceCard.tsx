import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, TrendingUp, TrendingDown, Wallet, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroBalanceCardProps {
  mainBalance: number;
  invested: number;
  profit: number;
  loading?: boolean;
  status?: "active" | "pending" | "inactive";
}

export function HeroBalanceCard({ mainBalance, invested, profit, loading, status = "active" }: HeroBalanceCardProps) {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(false);
  const isPositive = profit >= 0;
  const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

  const format = (n: number) =>
    `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const mask = (n: number) => (hidden ? "••••••" : format(n));

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-gold/20 p-6 sm:p-8 bg-gradient-to-br from-card via-card to-secondary/50">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-12 w-48 mb-6" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gold/20 p-6 sm:p-8 bg-gradient-to-br from-card via-card to-secondary/50 shadow-[0_20px_60px_-20px_hsla(42,52%,54%,0.25)]">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-teal/5 blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {t("hero.mainBalance")}
          </p>
          <button
            onClick={() => setHidden((v) => !v)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label={hidden ? t("hero.show") : t("hero.hide")}
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground tracking-tight">
            {mask(mainBalance)}
          </h2>
        </div>

        {!hidden && invested > 0 && (
          <div className={cn("inline-flex items-center gap-1.5 text-sm font-medium mt-2", isPositive ? "text-teal" : "text-destructive")}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>
              {isPositive ? "+" : ""}{profitPercent.toFixed(2)}% {t("hero.allTime")}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="p-4 rounded-2xl bg-background/40 backdrop-blur-sm border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{t("hero.invested")}</span>
            </div>
            <p className="text-lg font-semibold truncate">{mask(invested)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-background/40 backdrop-blur-sm border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Coins className={cn("w-3.5 h-3.5", isPositive ? "text-teal" : "text-destructive")} />
              <span className="text-xs text-muted-foreground truncate">{t("hero.profit")}</span>
            </div>
            <p className={cn("text-lg font-semibold truncate", isPositive ? "text-teal" : "text-destructive")}>
              {hidden ? "••••••" : `${isPositive ? "+" : "-"}${format(profit)}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
