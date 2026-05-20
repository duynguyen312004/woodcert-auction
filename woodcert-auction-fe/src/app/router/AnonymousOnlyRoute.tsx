import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";

import { useAuthStore } from "@/shared/auth/auth-store";

export function AnonymousOnlyRoute() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Đang xác thực phiên làm việc...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
