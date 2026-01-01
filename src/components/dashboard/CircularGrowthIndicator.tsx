import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CircularGrowthIndicatorProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  loading?: boolean;
  label?: string;
}

export function CircularGrowthIndicator({
  percentage,
  size = 160,
  strokeWidth = 12,
  loading = false,
  label = "Total Growth",
}: CircularGrowthIndicatorProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="rounded-full" style={{ width: size, height: size }} />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Clamp percentage to reasonable display range
  const displayPercentage = Math.min(Math.max(percentage, -100), 200);
  const progress = Math.abs(displayPercentage) / 100;
  const offset = circumference - progress * circumference;

  const isPositive = percentage >= 0;
  const colorClass = isPositive ? "text-teal" : "text-destructive";
  const strokeColor = isPositive ? "hsl(var(--teal))" : "hsl(var(--destructive))";
  const bgStrokeColor = isPositive ? "hsl(var(--teal) / 0.1)" : "hsl(var(--destructive) / 0.1)";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgStrokeColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold", colorClass)}>
            {isPositive ? "+" : ""}{percentage.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground mt-1">{label}</span>
        </div>
      </div>
    </div>
  );
}
