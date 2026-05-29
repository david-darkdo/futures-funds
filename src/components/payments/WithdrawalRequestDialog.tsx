import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowDownToLine, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { validateNumber, validateWalletAddress, VALIDATION_LIMITS } from "@/lib/validation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Available = main_balance + profit_balance */
  availableBalance: number;
  onSuccess?: () => void;
}

const NETWORKS = [
  { value: "ethereum", label: "Ethereum (ETH)" },
  { value: "bitcoin", label: "Bitcoin (BTC)" },
  { value: "bsc", label: "Binance Smart Chain (BSC)" },
  { value: "polygon", label: "Polygon (MATIC)" },
  { value: "tron", label: "Tron (TRC20)" },
  { value: "solana", label: "Solana (SOL)" },
];

const CURRENCIES = [
  { value: "USDT", label: "USDT" },
  { value: "USDC", label: "USDC" },
  { value: "BTC", label: "BTC" },
  { value: "ETH", label: "ETH" },
];

export function WithdrawalRequestDialog({ open, onOpenChange, availableBalance, onSuccess }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [currency, setCurrency] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setWalletAddress("");
      setNetwork("");
      setCurrency("");
    }
  }, [open]);

  const amountValidation = amount.trim()
    ? validateNumber(amount, {
        fieldName: "Withdrawal amount",
        min: VALIDATION_LIMITS.WITHDRAWAL_AMOUNT.MIN,
        max: Math.min(VALIDATION_LIMITS.WITHDRAWAL_AMOUNT.MAX, availableBalance || 0),
      })
    : { isValid: false, value: 0, error: t("withdraw.amount") + " " + t("common.required") };

  const parsedAmount = amountValidation.value;
  const walletValidation = walletAddress.trim() && network
    ? validateWalletAddress(walletAddress, network)
    : { isValid: false, error: t("withdraw.address") + " " + t("common.required"), sanitizedValue: "" };

  const handleSubmit = async () => {
    if (!user || !amount || !walletAddress || !network || !currency) {
      toast.error(t("withdraw.fillAll"));
      return;
    }
    if (!amountValidation.isValid) {
      toast.error(amountValidation.error || t("withdraw.exceeds"));
      return;
    }
    if (!walletValidation.isValid) {
      toast.error(walletValidation.error || "Invalid wallet");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: parsedAmount,
      wallet_address: walletValidation.sanitizedValue,
      network,
      currency,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || t("withdraw.submitFailed"));
      return;
    }
    toast.success(t("withdraw.submitted"));
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("withdraw.title")}</DialogTitle>
          <DialogDescription>{t("withdraw.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          <div className="space-y-4 pb-1">
            <div className="p-4 rounded-lg bg-secondary">
              <p className="text-sm text-muted-foreground">{t("withdraw.available")}</p>
              <p className="text-2xl font-bold text-gold">
                ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t("withdraw.amount")} *</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                placeholder={t("withdraw.amountPh")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {parsedAmount > availableBalance && (
                <p className="text-xs text-destructive">{t("withdraw.exceeds")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("withdraw.network")} *</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder={t("withdraw.selectNetwork")} />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("withdraw.currency")} *</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder={t("withdraw.selectCurrency")} />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletAddress">{t("withdraw.address")} *</Label>
              <Input
                id="walletAddress"
                placeholder={t("withdraw.addressPh")}
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                maxLength={256}
              />
              {walletAddress && network && !walletValidation.isValid && (
                <p className="text-xs text-destructive">{walletValidation.error}</p>
              )}
            </div>

            <div className="p-4 rounded-lg border border-gold/20 bg-gold/5">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gold mb-1">{t("withdraw.important")}</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• {t("withdraw.info1")}</li>
                    <li>• {t("withdraw.info2")}</li>
                    <li>• {t("withdraw.info3")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button variant="gold" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t("withdraw.submitting") : t("withdraw.submit")}
            <ArrowDownToLine className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
