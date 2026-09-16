import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { DashboardRoute } from "@/components/auth/DashboardRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { SupportWidget } from "@/components/chat/SupportWidget";
import Index from "./pages/Index";
import Plans from "./pages/Plans";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardIndex from "./pages/dashboard/DashboardIndex";
import DashboardStart from "./pages/dashboard/DashboardStart";
import DashboardPending from "./pages/dashboard/DashboardPending";
import DashboardPortfolio from "./pages/dashboard/DashboardPortfolio";
import DashboardTransactions from "./pages/dashboard/DashboardTransactions";
import DashboardSettings from "./pages/dashboard/DashboardSettings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPayments from "./pages/AdminPayments";
import AdminInvestments from "./pages/AdminInvestments";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminWallets from "./pages/AdminWallets";
import AdminUsers from "./pages/AdminUsers";
import AdminUserState from "./pages/AdminUserState";
import AdminBundles from "./pages/AdminBundles";
import AdminProofs from "./pages/AdminProofs";
import AdminEmails from "./pages/AdminEmails";
import AdminSettings from "./pages/AdminSettings";
import AdminLiveChat from "./pages/AdminLiveChat";
import AdminAIBrain from "./pages/AdminAIBrain";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardIndex />} />
                <Route path="start" element={<DashboardRoute requiredState="start"><DashboardStart /></DashboardRoute>} />
                <Route path="pending" element={<DashboardRoute requiredState="pending"><DashboardPending /></DashboardRoute>} />
                <Route path="portfolio" element={<DashboardRoute requiredState="portfolio"><DashboardPortfolio /></DashboardRoute>} />
                <Route path="transactions" element={<DashboardRoute requiredState="portfolio"><DashboardTransactions /></DashboardRoute>} />
                <Route path="settings" element={<DashboardSettings />} />
              </Route>

              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
              <Route path="/admin/investments" element={<AdminRoute><AdminInvestments /></AdminRoute>} />
              <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawals /></AdminRoute>} />
              <Route path="/admin/wallets" element={<AdminRoute><AdminWallets /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/user-state" element={<AdminRoute><AdminUserState /></AdminRoute>} />
              <Route path="/admin/bundles" element={<AdminRoute><AdminBundles /></AdminRoute>} />
              <Route path="/admin/proofs" element={<AdminRoute><AdminProofs /></AdminRoute>} />
              <Route path="/admin/emails" element={<AdminRoute><AdminEmails /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/live-chat" element={<AdminRoute><AdminLiveChat /></AdminRoute>} />
              <Route path="/admin/ai-brain" element={<AdminRoute><AdminAIBrain /></AdminRoute>} />


              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
            <SupportWidget />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
