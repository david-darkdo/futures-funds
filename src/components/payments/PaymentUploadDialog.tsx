import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

interface Bundle {
  id: string;
  name: string;
  price_usd: number;
  description: string | null;
  daily_growth_rate: number | null;
}

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
  preselectedBundleId?: string;
  onSuccess?: () => void;
}

export function PaymentUploadDialog({
  open,
  onOpenChange,
  preselectedBundleId,
  onSuccess,
}: PaymentUploadDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<string>(preselectedBundleId || "");
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [txid, setTxid] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "pay" | "confirm">("select");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
      setStep("select");
      setCryptoAmount("");
      setTxid("");
      setProofFile(null);
      setProofPreview(null);
      if (preselectedBundleId) {
        setSelectedBundle(preselectedBundleId);
      }
    }
  }, [open, preselectedBundleId]);

  const fetchData = async () => {
    const [bundlesRes, walletsRes] = await Promise.all([
      supabase.from("bundles").select("*").eq("active", true).order("price_usd"),
      supabase.from("wallets").select("*").eq("active", true),
    ]);

    setBundles(bundlesRes.data || []);
    setWallets(walletsRes.data || []);

    if (walletsRes.data && walletsRes.data.length > 0) {
      setSelectedWallet(walletsRes.data[0].id);
    }
  };

  const selectedBundleData = bundles.find((b) => b.id === selectedBundle);
  const selectedWalletData = wallets.find((w) => w.id === selectedWallet);

  const copyAddress = () => {
    if (selectedWalletData) {
      navigator.clipboard.writeText(selectedWalletData.address);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }
      setProofFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProofPreview(previewUrl);
    }
  };

  const removeProofFile = () => {
    setProofFile(null);
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
      setProofPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        .upload(filePath, proofFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get the signed URL for the uploaded file
      const { data: signedData, error: signError } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      if (signError) {
        console.error("Signed URL error:", signError);
        // Fallback to public URL if signed fails
        const { data: publicData } = supabase.storage
          .from("payment-proofs")
          .getPublicUrl(filePath);
        return publicData.publicUrl;
      }

      return signedData.signedUrl;
    } catch (error) {
      console.error("Failed to upload proof:", error);
      toast.error("Failed to upload payment proof");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedBundle || !selectedWallet) {
      toast.error("Please complete all fields");
      return;
    }

    setSubmitting(true);

    // Upload proof image if provided
    let proofUrl: string | null = null;
    if (proofFile) {
      proofUrl = await uploadProofImage();
    }

    const { error } = await supabase.from("payments").insert({
      user_id: user.id,
      bundle_id: selectedBundle,
      crypto_amount: cryptoAmount ? parseFloat(cryptoAmount) : null,
      crypto_currency: selectedWalletData?.currency || null,
      txid: txid || null,
      proof_url: proofUrl,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit payment. Please try again.");
      setSubmitting(false);
      return;
    }

    toast.success("Payment submitted for review!");
    setSubmitting(false);
    onOpenChange(false);
    onSuccess?.();
    navigate("/dashboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Select Investment Bundle"}
            {step === "pay" && "Make Payment"}
            {step === "confirm" && "Confirm Payment"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Choose the bundle you'd like to invest in"}
            {step === "pay" && "Send crypto to the address below"}
            {step === "confirm" && "Upload proof and enter payment details"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Investment Bundle</Label>
              <Select value={selectedBundle} onValueChange={setSelectedBundle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bundle" />
                </SelectTrigger>
                <SelectContent>
                  {bundles.map((bundle) => (
                    <SelectItem key={bundle.id} value={bundle.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{bundle.name}</span>
                        <span className="text-gold ml-2">
                          ${bundle.price_usd.toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBundleData && (
              <div className="p-4 rounded-lg bg-secondary">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{selectedBundleData.name}</span>
                  <span className="text-gold font-bold">
                    ${selectedBundleData.price_usd.toLocaleString()}
                  </span>
                </div>
                {selectedBundleData.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedBundleData.description}
                  </p>
                )}
                {selectedBundleData.daily_growth_rate && (
                  <p className="text-sm text-teal mt-1">
                    Target: {selectedBundleData.daily_growth_rate}% daily growth
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
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
              <p className="text-sm text-muted-foreground text-center py-4">
                No payment methods available. Please contact support.
              </p>
            )}
          </div>
        )}

        {step === "pay" && selectedWalletData && selectedBundleData && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary text-center">
              <p className="text-sm text-muted-foreground mb-1">Amount to send</p>
              <p className="text-2xl font-bold text-gold">
                ${selectedBundleData.price_usd.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                in {selectedWalletData.currency}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Send {selectedWalletData.currency} to:</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={selectedWalletData.address}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyAddress}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-teal" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Network: {selectedWalletData.network}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-gold/20 bg-gold/5">
              <p className="text-sm font-medium text-gold mb-1">Important</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Send the exact amount in crypto equivalent</li>
                <li>• Only send {selectedWalletData.currency} on {selectedWalletData.network}</li>
                <li>• Your deposit will be verified within 24 hours</li>
              </ul>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            {/* Payment Proof Upload */}
            <div className="space-y-2">
              <Label>Payment Proof Screenshot</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {proofPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={proofPreview}
                    alt="Payment proof preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={removeProofFile}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
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
                  <span className="text-sm">Click to upload proof screenshot</span>
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                Upload a screenshot of your completed transaction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cryptoAmount">Amount Sent (optional)</Label>
              <Input
                id="cryptoAmount"
                type="number"
                step="any"
                placeholder={`Amount in ${selectedWalletData?.currency || "crypto"}`}
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txid">Transaction ID (optional)</Label>
              <Input
                id="txid"
                placeholder="Enter your transaction hash"
                value={txid}
                onChange={(e) => setTxid(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Providing the transaction ID helps us verify your payment faster
              </p>
            </div>

            <div className="p-4 rounded-lg bg-secondary">
              <p className="text-sm font-medium mb-2">Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bundle:</span>
                  <span>{selectedBundleData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="text-gold">${selectedBundleData?.price_usd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span>{selectedWalletData?.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proof:</span>
                  <span className={proofFile ? "text-teal" : "text-muted-foreground"}>
                    {proofFile ? "Uploaded" : "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "select" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={() => setStep("pay")}
                disabled={!selectedBundle || !selectedWallet}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === "pay" && (
            <>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button variant="gold" onClick={() => setStep("confirm")}>
                I've Made the Payment
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("pay")}>
                Back
              </Button>
              <Button 
                variant="gold" 
                onClick={handleSubmit} 
                disabled={submitting || uploading}
              >
                {uploading ? "Uploading..." : submitting ? "Submitting..." : "Submit for Review"}
                <Upload className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
