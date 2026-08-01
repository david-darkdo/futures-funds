import { useEffect, useState } from "react";
import { Menu, Save, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminData } from "@/hooks/useAdminData";
import { useAppSetting, DEFAULT_WHATSAPP_NUMBER, toWaLink } from "@/hooks/useAppSettings";

export default function AdminSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { payments, withdrawals } = useAdminData();
  const { value, loading, save } = useAppSetting("whatsapp_number");
  const [number, setNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) setNumber(value ?? DEFAULT_WHATSAPP_NUMBER);
  }, [loading, value]);

  const handleSave = async () => {
    const trimmed = number.trim();
    if (!toWaLink(trimmed)) {
      toast.error("Enter a valid phone number in international format, e.g. +447423449300");
      return;
    }
    setSaving(true);
    const error = await save(trimmed);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("WhatsApp number updated");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingPayments={payments.filter((p) => p.status === "pending").length}
        pendingWithdrawals={withdrawals.filter((w) => w.status === "pending").length}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2" aria-label="Menu">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">Platform configuration</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Card className="p-6 max-w-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-teal" />
              </div>
              <div>
                <h2 className="font-semibold">Support Contact</h2>
                <p className="text-sm text-muted-foreground">
                  Number used by the floating WhatsApp support button.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Contact Number</Label>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  id="whatsapp"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="+447423449300"
                  inputMode="tel"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Use full international format including country code.
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Card>
        </main>
      </div>
    </div>
  );
}
