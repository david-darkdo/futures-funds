import { useState } from "react";
import { useBalances } from "@/hooks/useBalances";
import { useTransactions } from "@/hooks/useTransactions";
import { useMaturityTicker } from "@/hooks/useMaturityTicker";
import { HeroBalanceCard } from "@/components/dashboard/HeroBalanceCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PlansPreview } from "@/components/dashboard/PlansPreview";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { PaymentUploadDialog } from "@/components/payments/PaymentUploadDialog";
import { WithdrawalRequestDialog } from "@/components/payments/WithdrawalRequestDialog";
import { InvestDialog } from "@/components/payments/InvestDialog";
import { ActiveInvestmentsCard } from "@/components/dashboard/ActiveInvestmentsCard";



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

      {runningInvestments.length > 0 && (
        <ActiveInvestmentsCard investments={runningInvestments} onRefresh={refetch} />
      )}

      <PlansPreview />


      <RecentTransactions />

      <PaymentUploadDialog open={depositOpen} onOpenChange={setDepositOpen} onSuccess={refetch} />
      <InvestDialog open={investOpen} onOpenChange={setInvestOpen} onSuccess={refetch} />
      <WithdrawalRequestDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} availableBalance={available} onSuccess={refetch} />
    </div>
  );
}
