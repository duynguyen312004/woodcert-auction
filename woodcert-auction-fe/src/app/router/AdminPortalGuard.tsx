/**
 * Blocks admin routes when the current JWT does not carry admin authority.
 *
 * This is only a client-side navigation guard. Backend authorization remains enforced by
 * @PreAuthorize on admin APIs.
 */
import { Home, Loader2, ShieldAlert } from "lucide-react";
import { Link, Outlet } from "react-router";

import { tokenHasPermission, tokenHasRole } from "@/shared/auth/decode-token";
import { useAuthStore } from "@/shared/auth/auth-store";
import { Button } from "@/shared/ui/button";

function hasAdminAuthority(accessToken: string | null) {
  return tokenHasRole(accessToken, "ROLE_ADMIN") || tokenHasPermission(accessToken, "BAN_USER");
}

function NoPermissionState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-6 text-foreground">
      <section className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" aria-hidden />
        <h1 className="mt-4 text-xl font-bold">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang này chỉ dành cho quản trị viên được cấp quyền vận hành hệ thống.
        </p>
        <Button type="button" variant="outline" size="sm" asChild className="mt-5">
          <Link to="/">
            <Home className="h-4 w-4" aria-hidden />
            Về trang chủ
          </Link>
        </Button>
      </section>
    </div>
  );
}

export function AdminPortalGuard() {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Đang kiểm tra quyền quản trị viên</span>
      </div>
    );
  }

  if (!hasAdminAuthority(accessToken)) {
    return <NoPermissionState />;
  }

  return <Outlet />;
}
