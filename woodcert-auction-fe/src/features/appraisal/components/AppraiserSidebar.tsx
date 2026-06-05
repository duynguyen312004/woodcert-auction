/**
 * Sidebar điều hướng cố định của khu appraiser.
 */
import { ArrowLeft, ClipboardList, History, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { useProfile } from "@/features/account";
import { authApi } from "@/features/auth";
import { clearAuthSession } from "@/shared/auth/auth-store";
import { APPRAISER_PATHS } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/utils";

const NAV_ITEMS = [
  { label: "Hàng chờ kiểm định", icon: ClipboardList, to: APPRAISER_PATHS.products },
  { label: "Đã xử lý", icon: History, to: APPRAISER_PATHS.reviewed },
] as const;

function isNavItemActive(pathname: string, to: string) {
  if (to === APPRAISER_PATHS.products) {
    return pathname === to || pathname.startsWith(`${to}/`);
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppraiserSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = profile?.fullName ?? "WoodCert";
  const initial = displayName.charAt(0).toUpperCase();

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
    <aside className="w-60 shrink-0 h-full bg-seller-sidebar border-r border-[#4e4637]/50 flex flex-col">
      <div className="p-6 flex flex-col gap-8 h-full">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full border border-brushed-brass shrink-0 overflow-hidden bg-seller-overlay flex items-center justify-center">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={displayName} className="size-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">{initial}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[10px] text-muted-warm hover:text-primary mb-1 transition-colors font-medium group"
            >
              <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
              Về trang chủ
            </Link>
            <h1 className="text-[#eae1d6] text-sm font-semibold truncate leading-tight">
              WoodCert Auction
            </h1>
            <p className="text-muted-warm text-xs leading-tight flex items-center gap-1">
              <ShieldCheck className="size-3" aria-hidden />
              Appraiser Portal
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1" aria-label="Appraiser navigation">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
            const isActive = isNavItemActive(location.pathname, to);

            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors",
                  isActive
                    ? "bg-seller-overlay text-primary font-semibold"
                    : "text-[#d2c5b2] hover:text-primary font-medium",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#4e4637]/50 pt-4">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-semibold text-[#d2c5b2] transition-colors hover:bg-seller-overlay hover:text-primary disabled:cursor-wait disabled:opacity-70"
          >
            {isLoggingOut ? (
              <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
            ) : (
              <LogOut className="size-5 shrink-0" aria-hidden />
            )}
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
