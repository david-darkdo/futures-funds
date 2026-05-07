import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useDemoInvestment } from "@/hooks/useDemoInvestment";

interface CreateDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDemoDialog({ open, onOpenChange }: CreateDemoDialogProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("5000");
  const [submitting, setSubmitting] = useState(false);
  const { createDemo } = useDemoInvestment();

  const handleCreate = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a positive number.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const success = await createDemo(numAmount);
    setSubmitting(false);

    if (success) {
      toast({ title: "Demo Investment Created! 🎉", description: `Your $${numAmount.toLocaleString()} demo investment is live.` });
      onOpenChange(false);
    } else {
      toast({ title: "Error", description: "Could not create demo investment. You may already have one.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            {t("demo.dialogTitle")}
          </DialogTitle>
          <DialogDescription>{t("demo.dialogDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-gold/5 border border-gold/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("demo.standardPlan")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-teal" />
              <span>Live performance updates</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("demo.amountLabel")}</label>
            <Input
              type="number"
              placeholder="Enter any amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
            />
            <p className="text-xs text-muted-foreground">{t("demo.amountHint")}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("demo.cancel")}</Button>
          <Button variant="gold" onClick={handleCreate} disabled={submitting} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {submitting ? t("demo.creating") : t("demo.start")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
