import { Award, Sparkles, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserRankBadgeProps {
  rank?: string | null;
  className?: string;
  showIcon?: boolean;
}

export function UserRankBadge({
  rank = "bronze",
  className,
  showIcon = true,
}: UserRankBadgeProps) {
  const normalized = (rank || "bronze").toLowerCase();

  const getRankConfig = () => {
    switch (normalized) {
      case "gold":
        return {
          label: "Gold VIP",
          badgeClass: "bg-gold/15 text-primary dark:text-gold border-gold/50 hover:bg-gold/25",
          icon: Sparkles,
        };
      case "silver":
        return {
          label: "Silver Elite",
          badgeClass: "bg-slate-300/40 text-slate-800 dark:text-slate-200 border-slate-500/50 dark:border-slate-400/40 hover:bg-slate-300/50",
          icon: ShieldCheck,
        };
      case "bronze":
      default:
        return {
          label: "Bronze Member",
          badgeClass: "bg-amber-700/15 text-amber-900 dark:text-amber-500 border-amber-600/50 hover:bg-amber-700/25",
          icon: Award,
        };
    }
  };

  const config = getRankConfig();
  const IconComponent = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold text-xs py-1 px-2.5 transition-all cursor-default select-none shadow-sm",
        config.badgeClass,
        className
      )}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  );
}
