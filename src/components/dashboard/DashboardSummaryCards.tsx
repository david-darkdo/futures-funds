import { Package, DollarSign, TrendingUp, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardsProps {
  bundleName: string | null;
  investedAmount: number;
  currentValue: number;
  growthPercent: number;
  loading?: boolean;
}

export function DashboardSummaryCards({
  bundleName,
  investedAmount,
  currentValue,
  growthPercent,
  loading = false
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Active Bundle",
      value: bundleName || "None",
      subtitle: bundleName ? "Currently active" : "No active bundle",
      icon: Package,
      iconBg: "bg-gold/10",
      iconColor: "text-gold"
    },
    {
      title: "Invested Amount",
      value: `$${investedAmount.toLocaleString()}`,
      subtitle: "Initial capital",
      icon: DollarSign,
      iconBg: "bg-teal/10",
      iconColor: "text-teal"
    },
    {
      title: "Current Value",
      value: `$${currentValue.toLocaleString()}`,
      subtitle: "Portfolio value",
      icon: TrendingUp,
      iconBg: "bg-gold/10",
      iconColor: "text-gold"
    },
    {
      title: "Growth",
      value: `+${growthPercent.toFixed(2)}%`,
      subtitle: "Total return",
      icon: Percent,
      iconBg: "bg-teal/10",
      iconColor: "text-teal"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-xl bg-card border border-border">
            <Skeleton className="h-10 w-10 rounded-lg mb-4" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.title}
          className="p-6 rounded-xl bg-card border border-border hover:border-gold/30 transition-colors"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <span className="text-sm text-muted-foreground">{card.title}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{card.value}</p>
          <p className="text-sm text-muted-foreground mt-1">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}