import { useState, useMemo } from "react";
import {
  Menu,
  X,
  Users,
  Search,
  Download,
  Snowflake,
  Sun,
  Eye,
  DollarSign,
  Award,
  TrendingUp,
  Shield,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { UserDetailDrawer } from "@/components/admin/UserDetailDrawer";
import { useAdminData } from "@/hooks/useAdminData";
import { format } from "date-fns";

export default function AdminUserState() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    profiles,
    investments,
    payments,
    withdrawals,
    stats,
    loading,
    refetch,
    updateUserStatus,
    toggleInvestingFreeze,
    adjustUserBalance,
    adjustUserProfit,
    setUserRank,
    sendNotification,
  } = useAdminData();

  // Map investments by user_id for quick lookup
  const userInvestmentsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    investments.forEach((inv) => {
      const list = map.get(inv.user_id) || [];
      list.push(inv);
      map.set(inv.user_id, list);
    });
    return map;
  }, [investments]);

  // Map payments by user_id
  const userPaymentsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    payments.forEach((p) => {
      const list = map.get(p.user_id) || [];
      list.push(p);
      map.set(p.user_id, list);
    });
    return map;
  }, [payments]);

  // Map withdrawals by user_id
  const userWithdrawalsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    withdrawals.forEach((w) => {
      const list = map.get(w.user_id) || [];
      list.push(w);
      map.set(w.user_id, list);
    });
    return map;
  }, [withdrawals]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return profiles.filter((p) => {
      // Search matching
      const matchesSearch =
        (p.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Tab filtering
      if (activeTab === "active") return p.status === "active";
      if (activeTab === "frozen") return !!p.investing_frozen;
      if (activeTab === "pending") return p.status === "pending";
      if (activeTab === "ranked") {
        const rank = (p.effective_rank || p.calculated_rank || "bronze").toLowerCase();
        return rank === "silver" || rank === "gold" || !!p.manual_rank;
      }
      if (activeTab === "investors") {
        const userInvs = userInvestmentsMap.get(p.id) || [];
        return userInvs.some((i) => i.state === "active");
      }

      return true;
    });
  }, [profiles, searchTerm, activeTab, userInvestmentsMap]);

  // Aggregated KPIs
  const totalBalanceAllUsers = profiles.reduce(
    (sum, p) => sum + (p.main_balance || 0) + (p.profit_balance || 0),
    0
  );
  const frozenCount = profiles.filter((p) => p.investing_frozen).length;
  const activeInvestorsCount = profiles.filter((p) => {
    const invs = userInvestmentsMap.get(p.id) || [];
    return invs.some((i) => i.state === "active");
  }).length;

  const handleInspect = (user: any) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      "User ID",
      "Full Name",
      "Email",
      "Status",
      "Investing Frozen",
      "Rank",
      "Main Balance",
      "Profit Balance",
      "Active Investments Count",
      "Created At",
    ];

    const rows = filteredUsers.map((u) => {
      const invs = userInvestmentsMap.get(u.id) || [];
      const activeCount = invs.filter((i) => i.state === "active").length;
      return [
        u.id,
        u.full_name || "N/A",
        u.email || "N/A",
        u.status || "pending",
        u.investing_frozen ? "Yes" : "No",
        u.effective_rank || "bronze",
        (u.main_balance || 0).toFixed(2),
        (u.profit_balance || 0).toFixed(2),
        activeCount,
        u.created_at || "",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-state-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const rankBadgeColor = (rank?: string) => {
    switch (rank?.toLowerCase()) {
      case "gold":
        return "bg-gold/20 text-primary dark:text-gold border-gold/50";
      case "silver":
        return "bg-slate-300/40 text-slate-800 dark:text-slate-200 border-slate-500/50 dark:border-slate-400/40";
      case "bronze":
      default:
        return "bg-amber-700/20 text-amber-900 dark:text-amber-500 border-amber-600/50";
    }
  };

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

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">User State Management</h1>
                  <p className="text-xs text-muted-foreground">
                    Authoritative profile inspection, balances, investing freeze, and tier rank engine
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 space-y-6">
          {/* KPI Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs text-muted-foreground">Total Registered</p>
              <p className="text-2xl font-bold mt-1">{profiles.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-teal/20">
              <p className="text-xs text-muted-foreground">Active Investors</p>
              <p className="text-2xl font-bold text-teal mt-1">{activeInvestorsCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-blue-500/20">
              <p className="text-xs text-muted-foreground">Frozen Investing</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{frozenCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-gold/20">
              <p className="text-xs text-muted-foreground">Total User Balances</p>
              <p className="text-2xl font-bold text-gold mt-1">
                ${totalBalanceAllUsers.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Search and Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-card border-border"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="bg-secondary/60">
                <TabsTrigger value="all">All ({profiles.length})</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="investors">Investors ({activeInvestorsCount})</TabsTrigger>
                <TabsTrigger value="frozen">Frozen ({frozenCount})</TabsTrigger>
                <TabsTrigger value="ranked">Ranked</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl bg-card/30">
              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-base font-medium">No users matched your criteria</p>
              <p className="text-xs mt-1">Try clearing your search query or selecting another filter tab.</p>
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User / Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Investing State</TableHead>
                    <TableHead>Rank Tier</TableHead>
                    <TableHead>Main Balance</TableHead>
                    <TableHead>Profit Balance</TableHead>
                    <TableHead>Active Investments</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const invs = userInvestmentsMap.get(user.id) || [];
                    const activeInvs = invs.filter((i) => i.state === "active");
                    const activeSum = activeInvs.reduce(
                      (sum, i) => sum + (i.initial_amount || 0),
                      0
                    );

                    return (
                      <TableRow key={user.id} className="hover:bg-secondary/30 transition-colors">
                        <TableCell>
                          <div className="font-medium text-sm text-foreground">
                            {user.full_name || "Unnamed Client"}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {user.email || "No email"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.status === "active"
                                ? "bg-teal/20 text-teal border-teal/40"
                                : user.status === "suspended"
                                ? "bg-destructive/20 text-destructive border-destructive/40"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {user.status || "pending"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {user.investing_frozen ? (
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">
                              <Snowflake className="w-3 h-3 mr-1" /> Frozen
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-teal/10 text-teal border-teal/30">
                              Active
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={rankBadgeColor(user.effective_rank || "bronze")}>
                            <Award className="w-3 h-3 mr-1" />
                            {(user.effective_rank || "bronze").toUpperCase()}
                            {user.manual_rank && " *"}
                          </Badge>
                        </TableCell>

                        <TableCell className="font-semibold text-sm">
                          ${(user.main_balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>

                        <TableCell className="font-semibold text-sm text-teal">
                          ${(user.profit_balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>

                        <TableCell>
                          {activeInvs.length > 0 ? (
                            <div>
                              <span className="font-semibold text-sm text-gold">
                                ${activeSum.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({activeInvs.length})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 border-border hover:border-gold/40 hover:text-gold"
                            onClick={() => handleInspect(user)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </main>
      </div>

      {/* User Inspection & State Drawer */}
      <UserDetailDrawer
        user={selectedUser}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateStatus={updateUserStatus}
        onToggleFreeze={toggleInvestingFreeze}
        onAdjustBalance={adjustUserBalance}
        onAdjustProfit={adjustUserProfit}
        onSetRank={setUserRank}
        onSendNotification={sendNotification}
        userInvestments={selectedUser ? userInvestmentsMap.get(selectedUser.id) || [] : []}
        userPayments={selectedUser ? userPaymentsMap.get(selectedUser.id) || [] : []}
        userWithdrawals={selectedUser ? userWithdrawalsMap.get(selectedUser.id) || [] : []}
        onRefresh={refetch}
      />
    </div>
  );
}
