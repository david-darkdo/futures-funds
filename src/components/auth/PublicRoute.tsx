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
        <LogoLoader />
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
