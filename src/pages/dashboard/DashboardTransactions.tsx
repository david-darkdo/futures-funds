import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions, calculatePortfolioMetrics, Transaction } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const typeConfig: Record<Transaction["type"], { 
  icon: typeof ArrowUpRight; 
  label: string; 
  colorClass: string;
  bgClass: string;
}> = {
  deposit: {
    icon: Wallet,
    label: "Deposit",
    colorClass: "text-teal",
    bgClass: "bg-teal/10",
  },
  growth: {
    icon: TrendingUp,
    label: "Performance Update",
    colorClass: "text-teal",
    bgClass: "bg-teal/10",
  },
  drawdown: {
    icon: TrendingDown,
    label: "Performance Update",
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10",
  },
  withdrawal: {
    icon: ArrowDownRight,
    label: "Withdrawal",
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
};

export default function DashboardTransactions() {
  const { transactions, loading } = useTransactions();
  const metrics = calculatePortfolioMetrics(transactions);

  if (loading) {
    return (
      <div className="flex-1 p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8 space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Initial Capital</p>
            <p className="text-2xl font-bold">
              ${metrics.initialCapital.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold">
              ${metrics.currentBalance.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Growth</p>
            <p className={cn(
              "text-2xl font-bold",
              metrics.totalGrowthPercent >= 0 ? "text-teal" : "text-destructive"
            )}>
              {metrics.totalGrowthPercent >= 0 ? "+" : ""}
              {metrics.totalGrowthPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Profit</p>
            <p className={cn(
              "text-2xl font-bold",
              metrics.totalProfit >= 0 ? "text-teal" : "text-destructive"
            )}>
              {metrics.totalProfit >= 0 ? "+$" : "-$"}
              {Math.abs(metrics.totalProfit).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Your transaction history will appear here</p>
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
                  {transactions.map((transaction) => {
                    const config = typeConfig[transaction.type];
                    const Icon = config.icon;
                    const isPositive = transaction.type === "deposit" || transaction.type === "growth";
                    
                    return (
                      <tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4">
                          <span className="text-sm">
                            {format(new Date(transaction.created_at), "MMM d, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground block">
                            {format(new Date(transaction.created_at), "h:mm a")}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-2 rounded-full", config.bgClass)}>
                              <Icon className={cn("w-4 h-4", config.colorClass)} />
                            </div>
                            <span className="font-medium">{config.label}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={cn(
                            "font-semibold",
                            isPositive ? "text-teal" : "text-destructive"
                          )}>
                            {isPositive ? "+" : "-"}${Math.abs(transaction.amount).toLocaleString()}
                          </span>
                          {transaction.percentage_change !== null && (
                            <span className="text-xs text-muted-foreground block">
                              {transaction.type === "growth" ? "+" : "-"}
                              {transaction.percentage_change}%
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-medium">
                            ${transaction.balance_after.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {transaction.description || "—"}
                          </span>
                        </td>
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
