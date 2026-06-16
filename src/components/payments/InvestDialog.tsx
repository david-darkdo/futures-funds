import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useBalances } from "@/hooks/useBalances";
import { Layers, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { notifyEmail } from "@/lib/notify";


interface Bundle {
  id: string;
  name: string;
  daily_growth_rate: number | null;
  min_invest: number | null;
  max_invest: number | null;
  price_usd: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedBundleId?: string;
  onSuccess?: () => void;
}

export function InvestDialog({ open, onOpenChange, preselectedBundleId, onSuccess }: Props) {
  const { t } = useTranslation();
  const { mainBalance, investingFrozen, refetch } = useBalances();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [bundleId, setBundleId] = useState<string>(preselectedBundleId || "");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    if (preselectedBundleId) setBundleId(preselectedBundleId);
    supabase
      .from("bundles")
      .select("id, name, daily_growth_rate, min_invest, max_invest, price_usd")
      .eq("active", true)
      .order("price_usd")
      .then(({ data }) => setBundles((data || []) as Bundle[]));
  }, [open, preselectedBundleId]);

  const selected = bundles.find((b) => b.id === bundleId);
  const parsed = Number(amount);
  const min = selected?.min_invest && selected.min_invest > 0 ? Number(selected.min_invest) : 1;
  const max = selected?.max_invest && selected.max_invest > 0 ? Number(selected.max_invest) : Infinity;

  const handleSubmit = async () => {
    if (!bundleId) {
      toast.error(t("invest.selectBundle"));
      return;
    }
    if (!parsed || parsed <= 0) {
      toast.error(t("invest.enterAmount"));
      return;
    }
    if (parsed > mainBalance) {
      toast.error(t("invest.insufficient"));
      return;
    }
    if (parsed < min) {
      toast.error(`${t("invest.min")} $${min.toLocaleString()}`);
      return;
    }
    if (max !== Infinity && parsed > max) {
      toast.error(`${t("invest.max")} $${max.toLocaleString()}`);
      return;
    }
    if (investingFrozen) {
      toast.error(t("invest.frozen"));
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.rpc("invest_from_balance", {
      _bundle_id: bundleId,
      _amount: parsed,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || t("invest.failed"));
      return;
    }
    toast.success(t("invest.started"));
    notifyEmail("investment", {
      amount: parsed.toFixed(2),
      bundleName: selected?.name || "Bundle",
      dailyRate: String(selected?.daily_growth_rate ?? 0),
    });
    await refetch();
    onOpenChange(false);
    onSuccess?.();
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gold" />
            {t("invest.title")}
          </DialogTitle>
          <DialogDescription>{t("invest.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          <div className="space-y-4 pb-1">
            <div className="p-4 rounded-2xl bg-secondary">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("invest.available")}</p>
              <p className="text-2xl font-bold text-gold">
                ${mainBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {investingFrozen && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive">
                {t("invest.frozen")}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("invest.bundle")}</Label>
              <Select value={bundleId} onValueChange={setBundleId} disabled={investingFrozen}>
                <SelectTrigger>
                  <SelectValue placeholder={t("invest.selectBundle")} />
                </SelectTrigger>
                <SelectContent>
                  {bundles.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} — {b.daily_growth_rate ?? 0}% / 24h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected && (
              <div className="p-4 rounded-lg bg-card border border-border space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gold font-medium">
                  <TrendingUp className="w-4 h-4" />
                  {selected.daily_growth_rate ?? 0}% {t("invest.in24h")}
                </div>
                {selected.min_invest ? (
                  <p className="text-xs text-muted-foreground">
                    {t("invest.min")} ${Number(selected.min_invest).toLocaleString()}
                    {selected.max_invest ? ` · ${t("invest.max")} $${Number(selected.max_invest).toLocaleString()}` : ""}
                  </p>
                ) : null}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="invest-amount">{t("invest.amount")}</Label>
              <Input
                id="invest-amount"
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                placeholder={t("invest.amountPh")}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={investingFrozen}
              />
              {parsed > mainBalance && (
                <p className="text-xs text-destructive">{t("invest.insufficient")}</p>
              )}
              {selected && parsed > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("invest.expectedProfit")}{" "}
                  <span className="text-teal font-medium">
                    +${((parsed * (selected.daily_growth_rate ?? 0)) / 100).toFixed(2)}
                  </span>{" "}
                  {t("invest.in24h")}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button variant="gold" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t("invest.submitting") : t("invest.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
