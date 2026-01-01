import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ProfitTickerProps {
  currentValue: number;
  initialAmount: number;
  dailyChange?: number;
  loading?: boolean;
}

export function ProfitTicker({
  currentValue,
  initialAmount,
  dailyChange = 0,
  loading = false,
}: ProfitTickerProps) {
  const [displayValue, setDisplayValue] = useState(currentValue);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalProfit = currentValue - initialAmount;
  const totalProfitPercent = initialAmount > 0 ? ((currentValue - initialAmount) / initialAmount) * 100 : 0;
  const isPositive = totalProfit >= 0;

  // Animate value changes
  useEffect(() => {
    if (currentValue !== displayValue) {
      setIsAnimating(true);
      const startValue = displayValue;
      const endValue = currentValue;
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const newValue = startValue + (endValue - startValue) * easeOutCubic;
        
        setDisplayValue(newValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [currentValue]);

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-10 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Total Profit/Loss</span>
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-teal" />
        ) : (
          <TrendingDown className="w-4 h-4 text-destructive" />
        )}
      </div>
      
      <div className={cn(
        "text-3xl font-bold mb-1 transition-transform",
        isPositive ? "text-teal" : "text-destructive",
        isAnimating && "animate-pulse"
      )}>
        {isPositive ? "+" : ""}${Math.abs(totalProfit).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      
      <div className={cn(
        "text-sm font-medium",
        isPositive ? "text-teal/80" : "text-destructive/80"
      )}>
        {isPositive ? "+" : ""}{totalProfitPercent.toFixed(2)}% all time
      </div>

      {dailyChange !== 0 && (
        <div className={cn(
          "mt-3 pt-3 border-t border-border text-sm",
          dailyChange >= 0 ? "text-teal/70" : "text-destructive/70"
        )}>
          Today: {dailyChange >= 0 ? "+" : ""}{dailyChange.toFixed(2)}%
        </div>
      )}
    </div>
  );
}
