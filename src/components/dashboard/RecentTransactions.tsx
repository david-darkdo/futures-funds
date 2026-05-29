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

const ICON: Record<string, any> = {
  deposit: Wallet,
  deposit_submitted: Clock,
  deposit_approved: Wallet,
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

export function txLabel(t: (k: string) => string, type: TransactionType) {
  const key = `txType.${type}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return type.replace(/_/g, " ");
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
            {recent.map((tx: Transaction) => {
              const Icon = ICON[tx.type] || Wallet;
              const isPositive = POSITIVE.has(tx.type);
              return (
                <li key={tx.id} className="flex items-center gap-3 p-3 sm:p-4">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    isPositive ? "bg-teal/10 text-teal" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{txLabel(t, tx.type)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tx.description || format(new Date(tx.created_at), "MMM d · h:mm a")}
                    </p>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold shrink-0",
                    isPositive ? "text-teal" : "text-destructive"
                  )}>
                    {isPositive ? "+" : "-"}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
