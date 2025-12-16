import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit2, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

interface Wallet {
  id: string;
  address: string;
  network: string;
  currency: string;
  label: string | null;
  active: boolean | null;
  created_at: string | null;
}

interface WalletManagerProps {
  wallets: Wallet[];
  onAdd: (wallet: Omit<Wallet, "id" | "created_at">) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<Wallet>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
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
  { value: "BNB", label: "BNB" },
  { value: "SOL", label: "SOL" },
];

export function WalletManager({ wallets, onAdd, onUpdate, onDelete }: WalletManagerProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editWallet, setEditWallet] = useState<Wallet | null>(null);
  const [deleteWallet, setDeleteWallet] = useState<Wallet | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [currency, setCurrency] = useState("");
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(true);

  const resetForm = () => {
    setAddress("");
    setNetwork("");
    setCurrency("");
    setLabel("");
    setActive(true);
  };

  const handleAdd = async () => {
    if (!address || !network || !currency) {
      toast.error("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    const success = await onAdd({ address, network, currency, label: label || null, active });
    if (success) {
      resetForm();
      setAddDialogOpen(false);
    }
    setProcessing(false);
  };

  const handleEdit = async () => {
    if (!editWallet) return;

    setProcessing(true);
    await onUpdate(editWallet.id, { address, network, currency, label: label || null, active });
    resetForm();
    setEditWallet(null);
    setProcessing(false);
  };

  const handleDelete = async () => {
    if (!deleteWallet) return;

    setProcessing(true);
    await onDelete(deleteWallet.id);
    setDeleteWallet(null);
    setProcessing(false);
  };

  const openEditDialog = (wallet: Wallet) => {
    setAddress(wallet.address);
    setNetwork(wallet.network);
    setCurrency(wallet.currency);
    setLabel(wallet.label || "");
    setActive(wallet.active ?? true);
    setEditWallet(wallet);
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Wallet Addresses</h3>
          <p className="text-sm text-muted-foreground">
            Manage crypto wallet addresses for user payments
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Wallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Wallet Address</DialogTitle>
              <DialogDescription>
                Add a new wallet address for receiving crypto payments
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="network">Network *</Label>
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
                <Label htmlFor="currency">Currency *</Label>
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
                <Label htmlFor="address">Wallet Address *</Label>
                <Input
                  id="address"
                  placeholder="Enter wallet address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  placeholder="e.g., Primary USDT Wallet"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleAdd} disabled={processing}>
                Add Wallet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No wallets configured. Add a wallet to start receiving payments.
                </TableCell>
              </TableRow>
            ) : (
              wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">
                    {wallet.label || "—"}
                  </TableCell>
                  <TableCell>
                    {NETWORKS.find((n) => n.value === wallet.network)?.label || wallet.network}
                  </TableCell>
                  <TableCell>{wallet.currency}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm truncate max-w-[180px]">
                        {wallet.address}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyAddress(wallet.address)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {wallet.active ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal/10 text-teal border border-teal/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEditDialog(wallet)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteWallet(wallet)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editWallet} onOpenChange={() => setEditWallet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wallet</DialogTitle>
            <DialogDescription>
              Update wallet address details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Network</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Wallet Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWallet(null)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleEdit} disabled={processing}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteWallet} onOpenChange={() => setDeleteWallet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Wallet</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this wallet? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteWallet && (
            <div className="p-4 rounded-lg bg-secondary">
              <p className="font-medium">{deleteWallet.label || "Unnamed Wallet"}</p>
              <p className="text-sm text-muted-foreground">
                {deleteWallet.network} - {deleteWallet.currency}
              </p>
              <p className="font-mono text-sm mt-1 truncate">{deleteWallet.address}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteWallet(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
              Delete Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
