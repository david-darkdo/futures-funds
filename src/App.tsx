import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
            </Route>

            {/* Admin routes - locked to admin role */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute requireAdmin><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/investments" element={<ProtectedRoute requireAdmin><AdminInvestments /></ProtectedRoute>} />
            <Route path="/admin/withdrawals" element={<ProtectedRoute requireAdmin><AdminWithdrawals /></ProtectedRoute>} />
            <Route path="/admin/wallets" element={<ProtectedRoute requireAdmin><AdminWallets /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/bundles" element={<ProtectedRoute requireAdmin><AdminBundles /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
