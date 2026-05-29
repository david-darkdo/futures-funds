import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlaskConical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBalances } from "@/hooks/useBalances";
import { useTransactions } from "@/hooks/useTransactions";
import { useDemoInvestment } from "@/hooks/useDemoInvestment";
import { useMaturityTicker } from "@/hooks/useMaturityTicker";
import { HeroBalanceCard } from "@/components/dashboard/HeroBalanceCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PlansPreview } from "@/components/dashboard/PlansPreview";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { PaymentUploadDialog } from "@/components/payments/PaymentUploadDialog";
import { WithdrawalRequestDialog } from "@/components/payments/WithdrawalRequestDialog";
import { InvestDialog } from "@/components/payments/InvestDialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

function DemoStrip() {
  const { t } = useTranslation();
  const { demoInvestment, currentValue, deleteDemo, loading } = useDemoInvestment();
  const [deleting, setDeleting] = useState(false);
  if (loading || !demoInvestment) return null;
  const profit = currentValue - demoInvestment.initial_amount;
  return (
    <Card className="border-gold/20 bg-gold/5">
      <CardContent className="p-4 flex items-center gap-3">
        <Badge variant="outline" className="border-gold/40 text-gold gap-1.5">
          <FlaskConical className="w-3 h-3" /> Demo
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            ${currentValue.toFixed(2)}{" "}
            <span className={profit >= 0 ? "text-teal text-xs" : "text-destructive text-xs"}>
              {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground truncate">{demoInvestment.bundle?.name ?? "Demo"}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={async () => {
            setDeleting(true);
            await deleteDemo();
            setDeleting(false);
            toast({ title: "Demo removed" });
          }}
          disabled={deleting}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPortfolio() {
  const { mainBalance, profitBalance, investedAmount, runningInvestments, investingFrozen, loading, refetch } = useBalances();
  useTransactions(); // realtime subscription
  useMaturityTicker(refetch);
  const [depositOpen, setDepositOpen] = useState(false);
  const [investOpen, setInvestOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const available = mainBalance + profitBalance;
  const hasActive = runningInvestments.length > 0;

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-5xl mx-auto w-full">
      <HeroBalanceCard
        mainBalance={mainBalance}
        invested={investedAmount}
        profit={profitBalance}
        loading={loading}
        status={hasActive ? "active" : mainBalance > 0 ? "active" : "inactive"}
      />

      <QuickActions
        onDeposit={() => setDepositOpen(true)}
        onInvest={() => setInvestOpen(true)}
        onWithdraw={() => setWithdrawOpen(true)}
        canInvest={!investingFrozen && mainBalance > 0}
        canWithdraw={available > 0}
      />

      <DemoStrip />

      <PlansPreview />

      <RecentTransactions />

      <PaymentUploadDialog open={depositOpen} onOpenChange={setDepositOpen} onSuccess={refetch} />
      <InvestDialog open={investOpen} onOpenChange={setInvestOpen} onSuccess={refetch} />
      <WithdrawalRequestDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} availableBalance={available} onSuccess={refetch} />
    </div>
  );
}
