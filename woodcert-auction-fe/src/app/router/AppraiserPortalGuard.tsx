/**
 * Chặn truy cập vào khu appraiser khi không có quyền APPROVE_PRODUCT.
 *
 * Guard chỉ kiểm tra claims trong JWT hiện tại; không cần gọi thêm API profile.
 * Appraiser role được cấp sẵn ngoài luồng FE này.
 */
import { Home, Loader2, LogOut, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";

import { authApi } from "@/features/auth";
import { hasAppraiserAuthority } from "@/shared/auth/appraiser-authority";
import { clearAuthSession, useAuthStore } from "@/shared/auth/auth-store";
import { decodeCurrentUserId } from "@/shared/auth/decode-token";
import { Button } from "@/shared/ui/button";

export { decodeCurrentUserId };

function NoPermissionState() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } finally {
      clearAuthSession();
      setIsLoggingOut(false);
      void navigate("/", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-ivory px-6 text-ink-blue">
      <section className="max-w-md rounded-lg border border-[#4e4637]/20 bg-white p-6 text-center shadow-sm">
        <ShieldAlert className="mx-auto size-10 text-terracotta" aria-hidden />
        <h1 className="mt-4 font-serif text-xl font-bold">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-muted-warm">
          Trang này chỉ dành cho kiểm định viên. Tài khoản của bạn chưa được cấp quyền kiểm định.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/">
              <Home className="h-4 w-4" aria-hidden />
              Về trang chủ
            </Link>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden />
            )}
            Đăng xuất
          </Button>
        </div>
      </section>
    </div>
  );
}

export function AppraiserPortalGuard() {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-ivory text-ink-blue">
        <Loader2 className="size-6 animate-spin text-brushed-brass" aria-hidden />
        <span className="sr-only">Đang kiểm tra quyền kiểm định viên</span>
      </div>
    );
  }

  if (!hasAppraiserAuthority(accessToken)) {
    return <NoPermissionState />;
  }

  return <Outlet />;
}
