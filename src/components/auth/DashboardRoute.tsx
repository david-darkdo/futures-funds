import { Navigate, useLocation } from "react-router-dom";
import { useUserState, UserDashboardState } from "@/hooks/useUserState";
import { LogoLoader } from "@/components/ui/LogoLoader";

interface DashboardRouteProps {
  children: React.ReactNode;
  requiredState: UserDashboardState;
}

const stateToPath: Record<UserDashboardState, string> = {
  loading: "/dashboard",
  start: "/dashboard/start",
  pending: "/dashboard/pending",
  portfolio: "/dashboard/portfolio"
};

export function DashboardRoute({ children, requiredState }: DashboardRouteProps) {
  const { state, loading } = useUserState();
  const location = useLocation();

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

  // If user is not in the required state, redirect to correct path
  if (state !== requiredState) {
    const correctPath = stateToPath[state];
    if (location.pathname !== correctPath) {
      return <Navigate to={correctPath} replace />;
    }
  }

  return <>{children}</>;
}
