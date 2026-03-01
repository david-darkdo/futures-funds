import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, TrendingUp, DollarSign, Percent } from "lucide-react";
import { toast } from "sonner";
import { validateNumber, VALIDATION_LIMITS } from "@/lib/validation";

interface Bundle {
  id: string;
  name: string;
  price_usd: number;
  description: string | null;
  daily_growth_rate: number | null;
  slug: string;
  active: boolean | null;
  min_invest: number | null;
  max_invest: number | null;
}

interface BundlesManagerProps {
  bundles: Bundle[];
  onAdd: (bundle: Omit<Bundle, "id">) => Promise<boolean>;
  onUpdate: (bundleId: string, updates: Partial<Bundle>) => Promise<boolean>;
  onDelete: (bundleId: string) => Promise<boolean>;
}

export function BundlesManager({ bundles, onAdd, onUpdate, onDelete }: BundlesManagerProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [minInvest, setMinInvest] = useState("");
  const [maxInvest, setMaxInvest] = useState("");
  const [description, setDescription] = useState("");
  const [dailyGrowthRate, setDailyGrowthRate] = useState([1]);
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setSlug("");
    setPriceUsd("");
    setMinInvest("");
    setMaxInvest("");
    setDescription("");
    setDailyGrowthRate([1]);
    setIsActive(true);
  };

  const handleEdit = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setName(bundle.name);
    setSlug(bundle.slug);
    setPriceUsd(bundle.price_usd.toString());
    setMinInvest((bundle.min_invest ?? 0).toString());
    setMaxInvest((bundle.max_invest ?? 0).toString());
    setDescription(bundle.description || "");
    setDailyGrowthRate([bundle.daily_growth_rate || 1]);
    setIsActive(bundle.active ?? true);
    setEditDialogOpen(true);
  };

  const handleDelete = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setDeleteDialogOpen(true);
  };

  const handleAddSubmit = async () => {
    if (!name || !slug || !priceUsd) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate price
    const priceValidation = validateNumber(priceUsd, {
      fieldName: "Bundle price",
      min: VALIDATION_LIMITS.BUNDLE_PRICE.MIN,
      max: VALIDATION_LIMITS.BUNDLE_PRICE.MAX,
    });

    if (!priceValidation.isValid) {
      toast.error(priceValidation.error || "Invalid price");
      return;
    }

    const success = await onAdd({
      name,
      slug,
      price_usd: priceValidation.value,
      description: description || null,
      daily_growth_rate: dailyGrowthRate[0],
      active: isActive,
      min_invest: minInvest ? parseFloat(minInvest) : null,
      max_invest: maxInvest ? parseFloat(maxInvest) : null,
    });

    if (success) {
      setAddDialogOpen(false);
      resetForm();
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedBundle || !name || !slug || !priceUsd) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate price
    const priceValidation = validateNumber(priceUsd, {
      fieldName: "Bundle price",
      min: VALIDATION_LIMITS.BUNDLE_PRICE.MIN,
      max: VALIDATION_LIMITS.BUNDLE_PRICE.MAX,
    });

    if (!priceValidation.isValid) {
      toast.error(priceValidation.error || "Invalid price");
      return;
    }

    const success = await onUpdate(selectedBundle.id, {
      name,
      slug,
      price_usd: priceValidation.value,
      description: description || null,
      daily_growth_rate: dailyGrowthRate[0],
      active: isActive,
      min_invest: minInvest ? parseFloat(minInvest) : null,
      max_invest: maxInvest ? parseFloat(maxInvest) : null,
    });

    if (success) {
      setEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedBundle) return;
    const success = await onDelete(selectedBundle.id);
    if (success) {
      setDeleteDialogOpen(false);
    }
  };

  const bundleFormJSX = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Bundle Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Starter Bundle"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Slug *</label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="e.g., starter"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Price (USD) *</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="number"
            value={priceUsd}
            onChange={(e) => setPriceUsd(e.target.value)}
            placeholder="1000"
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Min Invest (USD)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={minInvest}
              onChange={(e) => setMinInvest(e.target.value)}
              placeholder="50"
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Max Invest (USD)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={maxInvest}
              onChange={(e) => setMaxInvest(e.target.value)}
              placeholder="9999"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the bundle features..."
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-3 block">
          Daily Growth Rate: <span className="text-gold">{dailyGrowthRate[0]}%</span>
        </label>
        <div className="px-2">
          <Slider
            value={dailyGrowthRate}
            onValueChange={setDailyGrowthRate}
            min={1}
            max={100}
            step={0.5}
            className="[&_[role=slider]]:bg-gold"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>1%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ⚠️ This controls the simulated growth rate displayed to users. All values are admin-managed.
        </p>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
        <div>
          <p className="font-medium">Bundle Active</p>
          <p className="text-sm text-muted-foreground">Visible to users for purchase</p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Investment Bundles</h2>
          <p className="text-sm text-muted-foreground">
            Manage bundle offerings and growth rates
          </p>
        </div>
        <Button variant="gold" onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Bundle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bundles.map((bundle) => (
          <Card key={bundle.id} className={!bundle.active ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{bundle.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">/{bundle.slug}</p>
                </div>
                <Badge
                  className={
                    bundle.active
                      ? "bg-teal/10 text-teal border-teal/20"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {bundle.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Price</span>
                </div>
                <span className="font-semibold text-gold">
                  ${bundle.price_usd.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Min / Max</span>
                </div>
                <span className="font-semibold text-foreground text-sm">
                  ${(bundle.min_invest ?? 0).toLocaleString()} – ${(bundle.max_invest ?? 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Daily Rate</span>
                </div>
                <span className="font-semibold text-teal">
                  {bundle.daily_growth_rate || 0.5}%
                </span>
              </div>

              {bundle.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {bundle.description}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(bundle)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(bundle)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Bundle</DialogTitle>
          </DialogHeader>
          {bundleFormJSX}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleAddSubmit}>
              Create Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Bundle</DialogTitle>
          </DialogHeader>
          {bundleFormJSX}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bundle</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{selectedBundle?.name}</span>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>
              Delete Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
