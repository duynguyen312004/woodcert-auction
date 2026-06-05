import {
  Banknote,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Scale,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";

import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { authApi } from "@/features/auth";
import { clearAuthSession } from "@/shared/auth/auth-store";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";

import { useProfile } from "@/features/account";

const NAV = [
  { label: "Tổng quan", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Doanh thu", to: "/admin/revenue", icon: Banknote },
  { label: "Tranh chấp", to: "/admin/disputes", icon: Scale },
  { label: "Danh mục", to: "/admin/categories", icon: Boxes },
  { label: "Người dùng", to: "/admin/users", icon: Users },
  { label: "Audit Logs", to: "/admin/audit-logs", icon: ClipboardList },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const notification = useNotification();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { data: profile } = useProfile();

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuthSession();
      notification.success("Đã đăng xuất");
      navigate("/");
    },
    onError: () => {
      clearAuthSession();
      notification.warning("Phiên đăng nhập đã được đóng cục bộ");
      navigate("/");
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#181612] text-[#f2eee5]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#11100d] p-5">
        <div className="border-b border-white/10 pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">WoodCert</p>
          <h1 className="mt-1 text-lg font-bold">Admin Operations</h1>
        </div>
        <nav className="mt-6 grid gap-1">
          {NAV.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-[#d2c5b2] hover:bg-white/10 hover:text-primary",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4 space-y-3">
          {profile && (
            <div className="flex items-center gap-3 px-3 py-2 text-[#d2c5b2]">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-[#f2eee5]">
                  {profile.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#f2eee5]">{profile.fullName}</p>
                <p className="truncate text-xs text-[#a49a88]">{profile.email}</p>
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-[#d2c5b2] hover:bg-red-500/10 hover:text-red-300"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <AdminConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Đăng xuất khỏi trang admin?"
        description="Phiên làm việc hiện tại sẽ kết thúc và bạn cần đăng nhập lại để vào khu quản trị."
        confirmLabel="Đăng xuất"
        isPending={logoutMutation.isPending}
        onConfirm={() => void logoutMutation.mutateAsync()}
      />
    </div>
  );
}
