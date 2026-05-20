import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";

import { useAuthStore } from "@/shared/auth/auth-store";

/**
 * Route guard for authenticated-only routes.
 *
 * Behavior by auth status:
 * - `loading`       → show loading indicator while silent refresh runs
 * - `anonymous`     → redirect to login, preserving intended destination
 * - `authenticated` → render child routes
 */
export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Đang xác thực phiên làm việc…</p>
        </div>
      </div>
    );
  }

  if (status === "anonymous") {
    // Redirect to login but save the attempted url
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
