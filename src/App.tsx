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
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardIndex from "./pages/dashboard/DashboardIndex";
import DashboardStart from "./pages/dashboard/DashboardStart";
import DashboardPending from "./pages/dashboard/DashboardPending";
import DashboardPortfolio from "./pages/dashboard/DashboardPortfolio";
import DashboardTransactions from "./pages/dashboard/DashboardTransactions";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPayments from "./pages/AdminPayments";
import AdminInvestments from "./pages/AdminInvestments";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminWallets from "./pages/AdminWallets";
import AdminUsers from "./pages/AdminUsers";
import AdminBundles from "./pages/AdminBundles";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            
            {/* Dashboard routes with state-based routing */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardIndex />} />
              <Route 
                path="start" 
                element={
                  <DashboardRoute requiredState="start">
                    <DashboardStart />
                  </DashboardRoute>
                } 
              />
              <Route 
                path="pending" 
                element={
                  <DashboardRoute requiredState="pending">
                    <DashboardPending />
                  </DashboardRoute>
                } 
              />
              <Route 
                path="portfolio" 
                element={
                  <DashboardRoute requiredState="portfolio">
                    <DashboardPortfolio />
                  </DashboardRoute>
                } 
              />
              <Route 
                path="transactions" 
                element={
                  <DashboardRoute requiredState="portfolio">
                    <DashboardTransactions />
                  </DashboardRoute>
                } 
              />
            </Route>

            {/* Admin routes - locked to admin role */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
            <Route path="/admin/investments" element={<AdminRoute><AdminInvestments /></AdminRoute>} />
            <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawals /></AdminRoute>} />
            <Route path="/admin/wallets" element={<AdminRoute><AdminWallets /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/bundles" element={<AdminRoute><AdminBundles /></AdminRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
