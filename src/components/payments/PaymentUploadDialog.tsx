import { useState, useEffect, useRef } from "react";
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
import { Copy, CheckCircle, Upload, ArrowRight, ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { validateNumber, validateOptionalNumber, validateTransactionId, VALIDATION_LIMITS } from "@/lib/validation";
import { notifyEmail } from "@/lib/notify";


interface Wallet {
  id: string;
  address: string;
  network: string;
  currency: string;
  label: string | null;
}

interface PaymentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Deposit dialog — collects USD amount, shows company wallet,
 * lets user upload proof and submit for admin approval.
 * Approval credits main_balance via DB trigger; no bundle is tied to a deposit.
 */
export function PaymentUploadDialog({ open, onOpenChange, onSuccess }: PaymentUploadDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [amountUsd, setAmountUsd] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [txid, setTxid] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [step, setStep] = useState<"amount" | "pay" | "confirm">("amount");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("amount");
    setAmountUsd("");
    setCryptoAmount("");
    setTxid("");
    setProofFile(null);
    setProofPreview(null);
    supabase
      .from("wallets")
      .select("*")
      .eq("active", true)
      .then(({ data }) => {
        setWallets(data || []);
        if (data && data[0]) setSelectedWallet(data[0].id);
      });
  }, [open]);

  const selectedWalletData = wallets.find((w) => w.id === selectedWallet);
  const parsedAmount = Number(amountUsd);

  const copyAddress = () => {
    if (selectedWalletData) {
      navigator.clipboard.writeText(selectedWalletData.address);
      setCopied(true);
      toast.success(t("payment.addressCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("payment.selectImage"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("payment.imageTooLarge"));
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const removeProofFile = () => {
    setProofFile(null);
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadProofImage = async (): Promise<string | null> => {
    if (!proofFile || !user) return null;
    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileExt = proofFile.name.split(".").pop() || "png";
      const filePath = `${user.id}/${timestamp}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, proofFile, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data: signedData } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);
      return signedData?.signedUrl || null;
    } catch (e) {
      toast.error(t("payment.uploadFailed"));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedWallet) {
      toast.error(t("payment.completeAll"));
      return;
    }
    const amountValidation = validateNumber(amountUsd, {
      fieldName: "Amount",
      min: 1,
      max: 1_000_000,
    });
    if (!amountValidation.isValid) {
      toast.error(amountValidation.error || t("payment.completeAll"));
      return;
    }

    let validatedCryptoAmount: number | null = null;
    if (cryptoAmount.trim()) {
      const v = validateOptionalNumber(cryptoAmount, {
        fieldName: "Crypto amount",
        min: VALIDATION_LIMITS.CRYPTO_AMOUNT.MIN,
        max: VALIDATION_LIMITS.CRYPTO_AMOUNT.MAX,
      });
      if (!v.isValid) {
        toast.error(v.error || "Invalid crypto amount");
        return;
      }
      validatedCryptoAmount = v.value;
    }

    let validatedTxid: string | null = null;
    if (txid.trim()) {
      const t2 = validateTransactionId(txid, selectedWalletData?.network);
      if (!t2.isValid) {
        toast.error(t2.error || "Invalid transaction ID");
        return;
      }
      validatedTxid = t2.sanitizedValue || null;
    }

    setSubmitting(true);
    let proofUrl: string | null = null;
    if (proofFile) proofUrl = await uploadProofImage();

    const { error } = await supabase.from("payments").insert({
      user_id: user.id,
      bundle_id: null,
      amount_usd: amountValidation.value,
      crypto_amount: validatedCryptoAmount,
      crypto_currency: selectedWalletData?.currency || null,
      txid: validatedTxid,
      proof_url: proofUrl,
      status: "pending",
    } as any);

    if (error) {
      toast.error(t("payment.submitFailed"));
      setSubmitting(false);
      return;
    }

    toast.success(t("payment.submitted"));
    notifyEmail("deposit", {
      amount: amountValidation.value.toFixed(2),
      currency: selectedWalletData?.currency || "",
    });
    setSubmitting(false);
    onOpenChange(false);
    onSuccess?.();
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {step === "amount" && t("payment.depositTitle")}
            {step === "pay" && t("payment.makePayment")}
            {step === "confirm" && t("payment.confirmPayment")}
          </DialogTitle>
          <DialogDescription>
            {step === "amount" && t("payment.depositDesc")}
            {step === "pay" && t("payment.makePaymentDesc")}
            {step === "confirm" && t("payment.confirmPaymentDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {step === "amount" && (
            <div className="space-y-4 pb-1">
              <div className="space-y-2">
                <Label htmlFor="amountUsd">{t("payment.depositAmount")}</Label>
                <Input
                  id="amountUsd"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={1}
                  placeholder="100"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("payment.depositAmountHint")}</p>
              </div>

              <div className="space-y-2">
                <Label>{t("payment.paymentMethod")}</Label>
                <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("payment.selectMethod")} />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.currency} ({wallet.network})
                        {wallet.label && ` - ${wallet.label}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {wallets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t("payment.noMethods")}</p>
              )}
            </div>
          )}

          {step === "pay" && selectedWalletData && (
            <div className="space-y-4 pb-1">
              <div className="p-4 rounded-lg bg-secondary text-center">
                <p className="text-sm text-muted-foreground mb-1">{t("payment.amountToSend")}</p>
                <p className="text-2xl font-bold text-gold">
                  ${parsedAmount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("payment.in")} {selectedWalletData.currency}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t("payment.sendTo", { currency: selectedWalletData.currency })}</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={selectedWalletData.address} className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copyAddress} className="shrink-0">
                    {copied ? <CheckCircle className="w-4 h-4 text-teal" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("payment.network")}: {selectedWalletData.network}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gold/20 bg-gold/5">
                <p className="text-sm font-medium text-gold mb-1">{t("payment.important")}</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• {t("payment.exactAmount")}</li>
                  <li>• {t("payment.onlyOn", { currency: selectedWalletData.currency, network: selectedWalletData.network })}</li>
                  <li>• {t("payment.verifyWithin")}</li>
                </ul>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4 pb-1">
              <div className="space-y-2">
                <Label>{t("payment.proofScreenshot")}</Label>
                <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
                {proofPreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={proofPreview} alt="Proof" className="w-full h-48 object-cover" />
                    <button
                      onClick={removeProofFile}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-gold/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm">{t("payment.uploadHint")}</span>
                  </button>
                )}
                <p className="text-xs text-muted-foreground">{t("payment.uploadDesc")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cryptoAmount">{t("payment.amountSent")}</Label>
                <Input
                  id="cryptoAmount"
                  type="number"
                  step="any"
                  placeholder={t("payment.amountSentPh", { currency: selectedWalletData?.currency || "crypto" })}
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="txid">{t("payment.txid")}</Label>
                <Input
                  id="txid"
                  placeholder={t("payment.txidPh")}
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("payment.txidHint")}</p>
              </div>

              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-sm font-medium mb-2">{t("payment.summary")}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("payment.depositAmount")}:</span>
                    <span className="text-gold">${parsedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("payment.method")}:</span>
                    <span>{selectedWalletData?.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("payment.proof")}:</span>
                    <span className={proofFile ? "text-teal" : "text-muted-foreground"}>
                      {proofFile ? t("payment.uploaded") : t("payment.notProvided")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border pt-4">
          {step === "amount" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
              <Button
                variant="gold"
                onClick={() => setStep("pay")}
                disabled={!selectedWallet || !parsedAmount || parsedAmount <= 0}
              >
                {t("common.continue")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
          {step === "pay" && (
            <>
              <Button variant="outline" onClick={() => setStep("amount")}>{t("common.back")}</Button>
              <Button variant="gold" onClick={() => setStep("confirm")}>
                {t("payment.iPaid")} <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("pay")}>{t("common.back")}</Button>
              <Button variant="gold" onClick={handleSubmit} disabled={submitting || uploading}>
                {uploading ? t("payment.uploading") : submitting ? t("payment.submitting") : t("payment.submitReview")}
                <Upload className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
