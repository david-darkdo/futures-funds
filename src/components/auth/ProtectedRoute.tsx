import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";
import { LogoLoader } from "@/components/ui/LogoLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin route but user is not admin - redirect to dashboard start
  if (requireAdmin && role !== "admin") {
    console.log(
      "[ProtectedRoute] Admin required but role is:",
      role,
      "- redirecting to /dashboard/start"
    );
    return <Navigate to="/dashboard/start" replace />;
  }

  return (
    <>
      {/* Management mode indicator */}
      {role === "admin" && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-gold/20 border border-gold/40 text-gold px-3 py-1.5 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm">
          <Shield className="w-4 h-4" />
          MANAGEMENT MODE
        </div>
      )}
      {children}
    </>
  );
}
