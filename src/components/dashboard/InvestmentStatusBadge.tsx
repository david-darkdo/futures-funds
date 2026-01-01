import { cn } from "@/lib/utils";
import { CheckCircle, Clock, PauseCircle, XCircle } from "lucide-react";

type InvestmentState = "no_investment" | "pending_payment" | "active" | "paused" | "completed";

interface InvestmentStatusBadgeProps {
  status: InvestmentState;
  size?: "sm" | "md" | "lg";
}

export function InvestmentStatusBadge({ status, size = "md" }: InvestmentStatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          icon: CheckCircle,
          classes: "bg-teal/10 text-teal border-teal/20",
          dotClass: "bg-teal animate-pulse",
        };
      case "pending_payment":
        return {
          label: "Pending Review",
          icon: Clock,
          classes: "bg-gold/10 text-gold border-gold/20",
          dotClass: "bg-gold",
        };
      case "paused":
        return {
          label: "Paused",
          icon: PauseCircle,
          classes: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          dotClass: "bg-amber-500",
        };
      case "completed":
        return {
          label: "Completed",
          icon: CheckCircle,
          classes: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          dotClass: "bg-blue-500",
        };
      case "no_investment":
      default:
        return {
          label: "No Investment",
          icon: XCircle,
          classes: "bg-muted text-muted-foreground border-border",
          dotClass: "bg-muted-foreground",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        sizeClasses[size],
        config.classes
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
      <span>{config.label}</span>
    </span>
  );
}
