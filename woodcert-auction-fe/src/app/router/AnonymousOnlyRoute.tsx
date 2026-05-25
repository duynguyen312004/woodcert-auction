import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";

import { resolveAuthenticatedRedirect } from "@/shared/auth/auth-redirects";
import { useAuthStore } from "@/shared/auth/auth-store";

export function AnonymousOnlyRoute() {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();
  const from = location.state?.from?.pathname as string | undefined;

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
    return <Navigate to={resolveAuthenticatedRedirect({ accessToken, from })} replace />;
  }

  return <Outlet />;
}
