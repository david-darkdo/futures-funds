import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  Coins,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useTransactions, Transaction, TransactionType } from "@/hooks/useTransactions";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const POSITIVE = new Set<TransactionType>([
  "deposit",
  "deposit_approved",
  "growth",
  "profit_added",
  "investment_completed",
  "withdrawal_rejected",
]);

const NEGATIVE = new Set<TransactionType>([
  "withdrawal",
  "withdrawal_approved",
  "withdrawal_requested",
  "drawdown",
  "deposit_rejected",
]);

// "neutral" amounts render in ash (muted) regardless of sign
const NEUTRAL = new Set<TransactionType>([
  "investment_started",
  "withdrawal_rejected",
]);

const ICON: Record<string, any> = {
  deposit: Wallet,
  deposit_submitted: Clock,
  deposit_approved: CheckCircle,
  deposit_rejected: XCircle,
  growth: TrendingUp,
  drawdown: TrendingDown,
  withdrawal: ArrowDownRight,
  withdrawal_requested: Clock,
  withdrawal_approved: CheckCircle,
  withdrawal_rejected: XCircle,
  investment_started: Layers,
  investment_completed: CheckCircle,
  profit_added: Coins,
};

// status pill style by tx type
type StatusTone = "pending" | "success" | "danger" | "info" | "neutral";
const TONE: Record<string, StatusTone> = {
  deposit_submitted: "pending",
  withdrawal_requested: "pending",
  deposit_approved: "success",
  investment_completed: "success",
  profit_added: "success",
  withdrawal_approved: "danger",
  deposit_rejected: "danger",
  withdrawal_rejected: "neutral",
  drawdown: "danger",
  investment_started: "neutral",
  growth: "success",
  deposit: "success",
  withdrawal: "danger",
};

const TONE_CLASSES: Record<StatusTone, { wrap: string; dot: string; pulse: string }> = {
  pending: {
    wrap: "bg-gold/10 text-gold border-gold/30",
    dot: "bg-gold",
    pulse: "animate-pulse",
  },
  success: {
    wrap: "bg-teal/10 text-teal border-teal/30",
    dot: "bg-teal",
    pulse: "",
  },
  danger: {
    wrap: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
    pulse: "",
  },
  info: {
    wrap: "bg-primary/10 text-primary border-primary/30",
    dot: "bg-primary",
    pulse: "",
  },
  neutral: {
    wrap: "bg-muted/40 text-muted-foreground border-border",
    dot: "bg-muted-foreground",
    pulse: "",
  },
};

export function txLabel(t: (k: string) => string, type: TransactionType) {
  const key = `txType.${type}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return type.replace(/_/g, " ");
}

export function txStatusLabel(t: (k: string) => string, type: TransactionType) {
  const key = `txStatus.${type}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return "";
}

export function RecentTransactions({ limit = 4 }: { limit?: number }) {
  const { t } = useTranslation();
  const { transactions, loading } = useTransactions();
  const recent = transactions.slice(0, limit);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{t("recentTx.title")}</h3>
        <Link to="/dashboard/transactions" className="text-xs text-gold hover:text-gold-light inline-flex items-center gap-1">
          {t("recentTx.viewAll")} <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{t("recentTx.empty")}</div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((tx: Transaction, idx) => {
              const Icon = ICON[tx.type] || Wallet;
              const isPositive = POSITIVE.has(tx.type);
              const isNegative = NEGATIVE.has(tx.type);
              const tone = TONE[tx.type] || "info";
              const toneCls = TONE_CLASSES[tone];
              const status = txStatusLabel(t, tx.type);
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 p-3 sm:p-4 animate-in fade-in slide-in-from-bottom-1 duration-500"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform",
                    toneCls.wrap
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{txLabel(t, tx.type)}</p>
                      {status && (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide",
                          toneCls.wrap
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", toneCls.dot, toneCls.pulse)} />
                          {status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {tx.description || format(new Date(tx.created_at), "MMM d · h:mm a")}
                    </p>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold shrink-0",
                    isPositive ? "text-teal" : isNegative ? "text-destructive" : "text-foreground"
                  )}>
                    {isPositive ? "+" : isNegative ? "-" : ""}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
