import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
  height?: number;
  showPositiveGradient?: boolean;
}

export function PerformanceChart({
  data,
  loading = false,
  height = 280,
  showPositiveGradient = true,
}: PerformanceChartProps) {
  const formattedData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      formattedValue: `$${point.value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    }));
  }, [data]);

  // Determine if overall trend is positive
  const isPositiveTrend = useMemo(() => {
    if (data.length < 2) return true;
    return data[data.length - 1].value >= data[0].value;
  }, [data]);

  const gradientId = isPositiveTrend ? "positiveGradient" : "negativeGradient";
  const strokeColor = isPositiveTrend ? "hsl(var(--teal))" : "hsl(var(--destructive))";

  if (loading) {
    return <Skeleton className="w-full rounded-lg" style={{ height }} />;
  }

  if (data.length === 0) {
    return (
      <div
        className="w-full rounded-lg bg-secondary/30 flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-muted-foreground text-sm">No performance data yet</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Performance Over Time
        </h3>
        <div className={cn(
          "text-sm font-medium",
          isPositiveTrend ? "text-teal" : "text-destructive"
        )}>
          {isPositiveTrend ? "↑" : "↓"} {data.length > 1 
            ? ((data[data.length - 1].value - data[0].value) / data[0].value * 100).toFixed(2) 
            : 0}%
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--teal))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--teal))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              padding: "0.75rem",
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "0.25rem" }}
            formatter={(value: number, name: string, props: any) => [
              props.payload.formattedValue,
              "Balance",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
