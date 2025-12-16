import { useState, useEffect } from "react";
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

interface Wallet {
  id: string;
  address: string;
  network: string;
  currency: string;
  label: string | null;
}

interface WithdrawalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function WithdrawalRequestDialog({
  open,
  onOpenChange,
  availableBalance,
  onSuccess,
}: WithdrawalRequestDialogProps) {
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

  const parsedAmount = parseFloat(amount) || 0;
  const isValidAmount = parsedAmount > 0 && parsedAmount <= availableBalance;

  const handleSubmit = async () => {
    if (!user || !amount || !walletAddress || !network || !currency) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isValidAmount) {
      toast.error("Invalid withdrawal amount");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: parsedAmount,
      wallet_address: walletAddress,
      network,
      currency,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit withdrawal request");
      setSubmitting(false);
      return;
    }

    toast.success("Withdrawal request submitted!");
    setSubmitting(false);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Submit a withdrawal request to receive your funds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold text-gold">
              ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="any"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {parsedAmount > availableBalance && (
              <p className="text-xs text-destructive">
                Amount exceeds available balance
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Network *</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger>
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.map((n) => (
                  <SelectItem key={n.value} value={n.value}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Currency *</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletAddress">Wallet Address *</Label>
            <Input
              id="walletAddress"
              placeholder="Enter your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
          </div>

          <div className="p-4 rounded-lg border border-gold/20 bg-gold/5">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gold mb-1">Important</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Withdrawal requests are processed within 24-48 hours</li>
                  <li>• Ensure your wallet address is correct</li>
                  <li>• Funds sent to wrong addresses cannot be recovered</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="gold"
            onClick={handleSubmit}
            disabled={submitting || !isValidAmount || !walletAddress || !network || !currency}
          >
            {submitting ? "Submitting..." : "Request Withdrawal"}
            <ArrowDownToLine className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
