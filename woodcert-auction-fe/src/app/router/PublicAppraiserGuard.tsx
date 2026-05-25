/**
 * Chặn appraiser đi vào khu public khi phiên đăng nhập đã được khôi phục.
 */
import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router";

import { hasAppraiserAuthority } from "@/shared/auth/appraiser-authority";
import { useAuthStore } from "@/shared/auth/auth-store";
import { APPRAISER_PATHS } from "@/shared/constants/routes";

function PublicGuardLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Đang xác thực phiên làm việc...</p>
      </div>
    </div>
  );
}

export function PublicAppraiserGuard() {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (status === "loading") {
    return <PublicGuardLoadingState />;
  }

  if (status === "authenticated" && hasAppraiserAuthority(accessToken)) {
    return <Navigate to={APPRAISER_PATHS.products} replace />;
  }

  return <Outlet />;
}
