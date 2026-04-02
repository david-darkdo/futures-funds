import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LogoLoader } from "@/components/ui/LogoLoader";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user, role, loading } = useAuth();

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

  if (user) {
    // Redirect admins to admin dashboard, users to user dashboard
    const redirectTo = role === "admin" ? "/admin" : "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
