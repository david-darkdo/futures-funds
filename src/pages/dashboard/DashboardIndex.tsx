import { Navigate } from "react-router-dom";
import { useUserState } from "@/hooks/useUserState";
import { LogoLoader } from "@/components/ui/LogoLoader";

export default function DashboardIndex() {
  const { state, loading } = useUserState();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LogoLoader />
      </div>
    );
  }

  // Redirect based on user state
  switch (state) {
    case "portfolio":
      return <Navigate to="/dashboard/portfolio" replace />;
    case "pending":
      return <Navigate to="/dashboard/pending" replace />;
    default:
      return <Navigate to="/dashboard/start" replace />;
  }
}
