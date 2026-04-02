import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LogoLoader } from "@/components/ui/LogoLoader";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("[AdminRoute] state", {
      loading,
      userId: user?.id ?? null,
      role,
      path: location.pathname,
    });
  }, [loading, role, user?.id, location.pathname]);

  // 1) Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LogoLoader />
      </div>
    );
  }

  // 2) Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3) Authorized
  if (role === "admin") {
    return (
      <>
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-gold/20 border border-gold/40 text-gold px-3 py-1.5 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm">
          <Shield className="w-4 h-4" />
          MANAGEMENT MODE
        </div>
        {children}
      </>
    );
  }

  // 4) Unauthorized
  return <Navigate to="/dashboard/start" replace />;
}
