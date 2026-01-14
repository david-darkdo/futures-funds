import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Wallet, Activity } from "lucide-react";

interface CapitalOverviewProps {
  initialAmount: number;
  currentValue: number;
  status: "pending" | "active" | "paused" | "no_investment";
  bundleName?: string;
  loading?: boolean;
}

export function CapitalOverview({
  initialAmount,
  currentValue,
  status,
  bundleName,
  loading = false,
}: CapitalOverviewProps) {
  const profit = currentValue - initialAmount;
  const profitPercent = initialAmount > 0 ? ((currentValue - initialAmount) / initialAmount) * 100 : 0;
  const isPositive = profit >= 0;

  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal/10 text-teal border border-teal/20">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Under Management Review
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Paused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            No Investment
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-secondary/50">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Initial Investment",
      value: `$${initialAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: "text-muted-foreground",
    },
    {
      label: "Current Balance",
      value: `$${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-gold",
    },
    {
      label: "Total Profit/Loss",
      value: `${isPositive ? "+" : ""}$${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      subtitle: `${isPositive ? "+" : ""}${profitPercent.toFixed(2)}%`,
      icon: TrendingUp,
      color: isPositive ? "text-teal" : "text-destructive",
    },
  ];

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Capital Overview</h2>
          {bundleName && (
            <p className="text-sm text-muted-foreground">{bundleName}</p>
          )}
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="p-4 rounded-lg bg-secondary/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={cn("w-4 h-4", card.color)} />
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <p className={cn("text-xl font-bold", card.color)}>{card.value}</p>
            {card.subtitle && (
              <p className={cn("text-sm font-medium", card.color)}>{card.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
