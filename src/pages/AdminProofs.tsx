import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu, X, Search, ImageOff, ExternalLink, FileText } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminData } from "@/hooks/useAdminData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { maskEmail } from "@/lib/utils";
import { format } from "date-fns";

export default function AdminProofs() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const { payments, stats, loading } = useAdminData();

  const proofs = useMemo(() => {
    return payments
      .filter((p) => !!p.proof_url)
      .filter((p) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          p.profile?.full_name?.toLowerCase().includes(q) ||
          p.profile?.email?.toLowerCase().includes(q) ||
          p.bundle?.name?.toLowerCase().includes(q) ||
          p.txid?.toLowerCase().includes(q)
        );
      });
  }, [payments, query]);

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingPayments={stats.pendingPayments}
        pendingWithdrawals={stats.pendingWithdrawals}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-foreground"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search proofs..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 w-full md:w-64 bg-secondary border-border"
                />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium">
              <FileText className="w-4 h-4" />
              <span>Payment Proofs</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Payment Proofs</h1>
            <p className="text-muted-foreground">
              Every file uploaded by users as payment proof appears here.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : proofs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <ImageOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No payment proofs uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {proofs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="group rounded-xl overflow-hidden border border-border bg-card text-left hover:border-gold/50 transition-colors"
                >
                  <div className="aspect-square bg-secondary overflow-hidden">
                    <img
                      src={p.proof_url!}
                      alt={`Proof from ${p.profile?.full_name || "user"}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">
                      {p.profile?.full_name || "Unknown user"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {maskEmail(p.profile?.email)}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-gold truncate">{p.bundle?.name}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">
                        {p.created_at ? format(new Date(p.created_at), "MMM d") : ""}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-border bg-secondary">
                <img
                  src={selected.proof_url}
                  alt="Payment proof"
                  className="w-full max-h-[60vh] object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selected.profile?.full_name || "Unknown"}</p>
                  <p className="text-xs">{maskEmail(selected.profile?.email)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bundle</p>
                  <p className="font-medium">{selected.bundle?.name}</p>
                  <p className="text-xs text-gold">
                    ${selected.bundle?.price_usd?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selected.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {selected.created_at
                      ? format(new Date(selected.created_at), "MMM d, yyyy HH:mm")
                      : "—"}
                  </p>
                </div>
                {selected.txid && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-xs break-all">{selected.txid}</p>
                  </div>
                )}
              </div>
              <a
                href={selected.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gold hover:underline"
              >
                Open original <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
