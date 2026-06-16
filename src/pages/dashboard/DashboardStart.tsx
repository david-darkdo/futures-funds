import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Shield, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroBalanceCard } from "@/components/dashboard/HeroBalanceCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PlansPreview } from "@/components/dashboard/PlansPreview";
import { PaymentUploadDialog } from "@/components/payments/PaymentUploadDialog";
import { WithdrawalRequestDialog } from "@/components/payments/WithdrawalRequestDialog";
import { InvestDialog } from "@/components/payments/InvestDialog";
import { useBalances } from "@/hooks/useBalances";
import { useMaturityTicker } from "@/hooks/useMaturityTicker";

export default function DashboardStart() {
  const { t } = useTranslation();
  const { mainBalance, profitBalance, investedAmount, investingFrozen, refetch } = useBalances();
  useMaturityTicker(refetch);
  const [depositOpen, setDepositOpen] = useState(false);
  const [investOpen, setInvestOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const features = [
    { icon: TrendingUp, key: "dailyGrowth" },
    { icon: Shield, key: "secure" },
    { icon: Clock, key: "access" },
    { icon: Sparkles, key: "support" },
  ] as const;

  return (
    <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-5xl mx-auto w-full">
      <HeroBalanceCard
        mainBalance={mainBalance}
        invested={investedAmount}
        profit={profitBalance}
        status={mainBalance > 0 ? "active" : "inactive"}
      />
      <QuickActions
        onDeposit={() => setDepositOpen(true)}
        onInvest={() => setInvestOpen(true)}
        onWithdraw={() => setWithdrawOpen(true)}
        canInvest={!investingFrozen && mainBalance > 0}
        canWithdraw={mainBalance + profitBalance > 0}
      />

      <div className="text-center pt-4">
        <h1 className="text-2xl lg:text-3xl font-bold mb-3">{t("dashboard.startTitle")}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t("dashboard.startSubtitle")}</p>
      </div>

      <div className="flex items-center justify-center">
        <Button variant="gold" size="lg" onClick={() => setDepositOpen(true)} className="gap-2 w-full sm:w-auto">
          <Sparkles className="w-5 h-5" />
          {t("quickActions.deposit")}
        </Button>
      </div>

      <PlansPreview />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((f) => (
          <Card key={f.key} className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2 rounded-lg bg-gold/10"><f.icon className="w-5 h-5 text-gold" /></div>
              <CardTitle className="text-base">{t(`dashboard.features.${f.key}`)}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-muted-foreground text-sm">{t(`dashboard.features.${f.key}Desc`)}</p></CardContent>
          </Card>
        ))}
      </div>

      <PaymentUploadDialog open={depositOpen} onOpenChange={setDepositOpen} onSuccess={refetch} />
      <InvestDialog open={investOpen} onOpenChange={setInvestOpen} onSuccess={refetch} />
      <WithdrawalRequestDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} availableBalance={mainBalance + profitBalance} onSuccess={refetch} />
    </div>
  );
}
