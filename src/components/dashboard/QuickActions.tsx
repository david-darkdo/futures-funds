import { useTranslation } from "react-i18next";
import { ArrowDownToLine, Plus, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  onDeposit: () => void;
  onWithdraw: () => void;
  canWithdraw?: boolean;
}

export function QuickActions({ onDeposit, onWithdraw, canWithdraw = true }: QuickActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actions = [
    { label: t("quickActions.deposit"), icon: Plus, onClick: onDeposit, accent: "gold" as const },
    { label: t("quickActions.invest"), icon: Layers, onClick: () => navigate("/plans"), accent: "gold" as const },
    {
      label: t("quickActions.withdraw"),
      icon: ArrowDownToLine,
      onClick: onWithdraw,
      accent: "muted" as const,
      disabled: !canWithdraw,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          disabled={a.disabled}
          className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-gold/40 hover:bg-secondary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center group-hover:shadow-gold transition-all">
            <a.icon className="w-5 h-5 text-gold" />
          </div>
          <span className="text-xs font-medium text-foreground">{a.label}</span>
        </button>
      ))}
    </div>
  );
}
