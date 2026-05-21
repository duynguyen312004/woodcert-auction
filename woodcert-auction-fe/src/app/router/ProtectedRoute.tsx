import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";

import { useAuthStore } from "@/shared/auth/auth-store";

/**
 * Guard cho các route cần đăng nhập.
 *
 * Cách xử lý theo trạng thái đăng nhập:
 * - `loading`: hiện loading khi đang làm mới phiên
 * - `anonymous`: chuyển về đăng nhập và giữ lại trang muốn vào
 * - `authenticated`: cho hiển thị route con
 */
export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

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

  if (status === "anonymous") {
    // Chuyển về đăng nhập nhưng vẫn giữ lại URL người dùng đang muốn vào.
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
