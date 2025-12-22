import { Navigate } from "react-router-dom";
import { useUserState } from "@/hooks/useUserState";

export default function DashboardIndex() {
  const { state, loading } = useUserState();

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
