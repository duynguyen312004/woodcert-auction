/**
 * Chặn truy cập vào khu seller khi chưa đủ quyền.
 *
 * Guard này kiểm tra cả hồ sơ seller ở backend và quyền trong JWT hiện tại.
 * Sau khi vừa đăng ký seller, hồ sơ có thể đã tạo nhưng token cũ chưa có quyền,
 * nên người dùng cần đăng nhập lại.
 */
import { Loader2, ShieldAlert } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";

import { useProfile, useSellerProfile } from "@/features/account";
import { SELLER_PATHS } from "@/shared/constants";
import { isApiError } from "@/shared/api/errors";
import { clearAuthSession, useAuthStore } from "@/shared/auth/auth-store";
import { Button } from "@/shared/ui/button";

type TokenClaims = {
  roles?: unknown;
  permissions?: unknown;
};

// Chỉ đọc phần claims cần cho điều hướng giao diện, không dùng để xác thực bảo mật.
function decodeAccessTokenClaims(accessToken: string | null): TokenClaims | null {
  if (!accessToken) return null;

  const [, payload] = accessToken.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded)) as TokenClaims;
  } catch {
    return null;
  }
}

// Vào khu seller cần có role seller hoặc quyền tạo sản phẩm.
function tokenHasSellerAuthority(accessToken: string | null) {
  const claims = decodeAccessTokenClaims(accessToken);
  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  const permissions = Array.isArray(claims?.permissions) ? claims.permissions : [];

  return roles.includes("ROLE_SELLER") || permissions.includes("CREATE_PRODUCT");
}

function ReloginRequiredState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-ivory px-6 text-ink-blue">
      <section className="max-w-md rounded-lg border border-[#4e4637]/20 bg-white p-6 text-center shadow-sm">
        <ShieldAlert className="mx-auto size-10 text-brushed-brass" aria-hidden />
        <h1 className="mt-4 font-serif text-xl font-bold">Cần đăng nhập lại</h1>
        <p className="mt-2 text-sm text-muted-warm">
          Hồ sơ người bán đã được tạo, nhưng phiên đăng nhập hiện tại chưa có quyền seller. Vui lòng
          đăng nhập lại để cập nhật quyền truy cập.
        </p>
        <Button
          type="button"
          className="mt-5 text-primary-foreground"
          onClick={() => {
            clearAuthSession();
            window.location.assign("/auth/login");
          }}
        >
          Đăng nhập lại
        </Button>
      </section>
    </div>
  );
}

export function SellerPortalGuard() {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const profile = useProfile();
  const sellerProfile = useSellerProfile();

  if (profile.isPending || sellerProfile.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-ivory text-ink-blue">
        <Loader2 className="size-6 animate-spin text-brushed-brass" aria-hidden />
        <span className="sr-only">Đang kiểm tra quyền người bán</span>
      </div>
    );
  }

  if (
    sellerProfile.isError &&
    isApiError(sellerProfile.error) &&
    sellerProfile.error.statusCode !== 404
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-ivory px-6 text-ink-blue">
        <section className="max-w-md rounded-lg border border-[#4e4637]/20 bg-white p-6 text-center shadow-sm">
          <ShieldAlert className="mx-auto size-10 text-terracotta" aria-hidden />
          <h1 className="mt-4 font-serif text-xl font-bold">Không thể kiểm tra hồ sơ seller</h1>
          <p className="mt-2 text-sm text-muted-warm">{sellerProfile.error.message}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => void sellerProfile.refetch()}
          >
            Thử lại
          </Button>
        </section>
      </div>
    );
  }

  if (!sellerProfile.data) {
    // Người đã đăng nhập nhưng chưa là seller sẽ đi qua màn đăng ký seller trước.
    return <Navigate to={SELLER_PATHS.register} state={{ from: location }} replace />;
  }

  if (!tokenHasSellerAuthority(accessToken)) {
    return <ReloginRequiredState />;
  }

  return <Outlet />;
}
