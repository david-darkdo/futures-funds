import { useState, useEffect } from "react";
import { Clock, TrendingUp, PauseCircle, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, formatDistanceStrict } from "date-fns";

export interface RunningInvestmentItem {
  id: string;
  bundle_id: string;
  initial_amount: number;
  current_value?: number;
  growth_percentage?: number;
  state: string;
  matures_at: string | null;
  paused_at?: string | null;
  created_at: string;
  bundle?: { id: string; name: string; daily_growth_rate: number | null };
}

interface ActiveInvestmentsCardProps {
  investments: RunningInvestmentItem[];
  onRefresh?: () => void;
}

export function ActiveInvestmentsCard({ investments }: ActiveInvestmentsCardProps) {
  // Tick every second to update countdown display
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!investments || investments.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          Active Investment Cycles
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {investments.length} Active {investments.length === 1 ? "Position" : "Positions"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investments.map((inv) => {
          const isPaused = inv.state === "paused";
          const now = Date.now();
          const start = new Date(inv.created_at).getTime();
          const maturesAtMs = inv.matures_at ? new Date(inv.matures_at).getTime() : start + 24 * 60 * 60 * 1000;
          const totalDuration = Math.max(1, maturesAtMs - start);
          const elapsed = Math.max(0, Math.min(totalDuration, now - start));
          const progressPercent = Math.min(100, Math.round((elapsed / totalDuration) * 100));
          const isMatured = now >= maturesAtMs && !isPaused;

          const principal = inv.initial_amount || 0;
          const currentValue = inv.current_value && inv.current_value >= principal
            ? inv.current_value
            : principal * (1 + (inv.bundle?.daily_growth_rate || 25) / 100);
          const profit = Math.max(0, currentValue - principal);

          const formatCountdown = () => {
            if (isPaused) return "Cycle Paused by Management";
            if (isMatured) return "Cycle Matured — Settling";
            const diffMs = maturesAtMs - now;
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
          };

          return (
            <div
              key={inv.id}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-5 bg-card/80 backdrop-blur-sm transition-all",
                isPaused
                  ? "border-amber-500/30 bg-amber-500/[0.02]"
                  : isMatured
                  ? "border-teal/40 bg-teal/[0.02]"
                  : "border-border hover:border-gold/30 shadow-sm"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-base text-foreground">
                      {inv.bundle?.name || "Standard Portfolio"}
                    </h4>
                    {isPaused ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px]">
                        <PauseCircle className="w-3 h-3 mr-1" /> Paused
                      </Badge>
                    ) : isMatured ? (
                      <Badge variant="outline" className="bg-teal/15 text-teal border-teal/40 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Matured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-teal/10 text-teal border-teal/30 text-[10px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                        Running
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Deterministic 24-Hour Capital Growth
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Accrued Yield</span>
                  <p className="text-base font-bold text-teal">
                    +${profit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-2 gap-3 py-3 px-3.5 rounded-xl bg-secondary/40 border border-border/60 mb-4">
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Initial Capital
                  </span>
                  <p className="text-base font-bold text-foreground">
                    ${principal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Expected Settlement
                  </span>
                  <p className="text-base font-bold text-gold">
                    ${currentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Countdown & Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span>{formatCountdown()}</span>
                  </div>
                  <span className="font-semibold text-foreground">{progressPercent}%</span>
                </div>

                <Progress
                  value={progressPercent}
                  className={cn(
                    "h-2 bg-secondary",
                    isPaused ? "[&>div]:bg-amber-500" : isMatured ? "[&>div]:bg-teal" : "[&>div]:bg-gold"
                  )}
                />

                <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                  <span>Start: {new Date(inv.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>Maturity: {inv.matures_at ? new Date(inv.matures_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "24h"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
