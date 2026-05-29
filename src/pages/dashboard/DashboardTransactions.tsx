import { useTranslation } from "react-i18next";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { useBalances } from "@/hooks/useBalances";
import { txLabel } from "@/components/dashboard/RecentTransactions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const POSITIVE = new Set<string>([
  "deposit", "deposit_approved", "growth", "profit_added",
  "investment_completed", "withdrawal_rejected",
]);

export default function DashboardTransactions() {
  const { t } = useTranslation();
  const { transactions, loading } = useTransactions();
  const { mainBalance, profitBalance, investedAmount } = useBalances();
  const totalProfit = profitBalance;

  if (loading) {
    return (
      <div className="flex-1 p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t("hero.mainBalance")}</p>
          <p className="text-2xl font-bold">${mainBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t("hero.invested")}</p>
          <p className="text-2xl font-bold">${investedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t("hero.profit")}</p>
          <p className={cn("text-2xl font-bold", totalProfit >= 0 ? "text-teal" : "text-destructive")}>
            ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t("withdraw.available")}</p>
          <p className="text-2xl font-bold text-gold">${(mainBalance + profitBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("dashboard.transactionHistory")}</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("recentTx.empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Balance</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isPositive = POSITIVE.has(tx.type);
                    return (
                      <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-4 px-4 text-sm">
                          {format(new Date(tx.created_at), "MMM d, yyyy")}
                          <span className="text-xs text-muted-foreground block">{format(new Date(tx.created_at), "h:mm a")}</span>
                        </td>
                        <td className="py-4 px-4 font-medium">{txLabel(t, tx.type)}</td>
                        <td className={cn("py-4 px-4 text-right font-semibold", isPositive ? "text-teal" : "text-destructive")}>
                          {isPositive ? "+" : "-"}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          ${tx.balance_after.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell text-sm text-muted-foreground">{tx.description || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
