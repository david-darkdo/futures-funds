import { TrendingUp, Calendar, DollarSign, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface BundleGrowthPanelProps {
  bundleName: string;
  purchaseDate: string;
  startingAmount: number;
  currentValue: number;
  growthAmount: number;
  growthPercent: number;
  dailyRate: number;
  status: "active" | "pending" | "completed";
  daysActive: number;
  loading?: boolean;
}

export function BundleGrowthPanel({
  bundleName,
  purchaseDate,
  startingAmount,
  currentValue,
  growthAmount,
  growthPercent,
  dailyRate,
  status,
  daysActive,
  loading = false
}: BundleGrowthPanelProps) {
  const todaysGrowth = currentValue * (dailyRate / 100);

  const statusStyles = {
    active: "bg-teal/10 text-teal border-teal/20",
    pending: "bg-gold/10 text-gold border-gold/20",
    completed: "bg-muted text-muted-foreground border-border"
  };

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{bundleName}</h3>
            <p className="text-sm text-muted-foreground">{daysActive} days active</p>
          </div>
        </div>
        <Badge className={cn("capitalize border", statusStyles[status])}>
          {status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            <span>Purchase Date</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {new Date(purchaseDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Starting Amount</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            ${startingAmount.toLocaleString()}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Current Value</span>
          </div>
          <p className="text-lg font-semibold text-teal">
            ${currentValue.toLocaleString()}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Total Growth</span>
          </div>
          <p className="text-lg font-semibold text-gold">
            +${growthAmount.toLocaleString()} ({growthPercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <span>Simulated daily performance</span>
          </div>
          <span className="text-sm font-medium text-teal">
            +${todaysGrowth.toFixed(2)} ({dailyRate}%/day)
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Growth values are managed updates, not financial guarantees.
        </p>
      </div>
    </div>
  );
}