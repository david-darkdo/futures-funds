import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowDownRight, ChevronRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const iconFor = (t: Transaction["type"]) =>
  t === "deposit" ? Wallet : t === "growth" ? TrendingUp : t === "drawdown" ? TrendingDown : ArrowDownRight;

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
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("recentTx.empty")}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((tx) => {
              const Icon = iconFor(tx.type);
              const isPositive = tx.type === "deposit" || tx.type === "growth";
              const labelKey = `txType.${tx.type}`;
              return (
                <li key={tx.id} className="flex items-center gap-3 p-3 sm:p-4">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    isPositive ? "bg-teal/10 text-teal" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t(labelKey)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {format(new Date(tx.created_at), "MMM d · h:mm a")}
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
