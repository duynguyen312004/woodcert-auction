import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";

import logoUrl from "@/assets/brand/logo.jpg";
import { useProfile } from "@/features/account";
import { authApi } from "@/features/auth";
import { useWalletBalance } from "@/features/wallet";
import { clearAuthSession, useAuthStore } from "@/shared/auth/auth-store";

import { UserMenu } from "./UserMenu";
import { WalletWidget } from "./WalletWidget";

// Chỉ giữ các route thực sự tồn tại
const navLinks = [
  { label: "Trang chủ", to: "/" },
  { label: "Giới thiệu", to: "/about" },
  { label: "Đấu giá", to: "/auctions" },
  { label: "Tra cứu chứng nhận", to: "/certificates" },
  { label: "Tin tức", to: "/blog" },
  { label: "Hướng dẫn", to: "/guide" },
];

export function Header() {
  const authStatus = useAuthStore((state) => state.status);
  const isAuthenticated = authStatus === "authenticated";
  const isAuthLoading = authStatus === "loading";
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lấy thông tin profile để xác định vai trò điều hướng
  const { data: profile } = useProfile();
  const isAdmin = profile?.roles?.includes("ADMIN");
  const isAppraiser = profile?.roles?.includes("APPRAISER");
  const isSeller = profile?.roles?.includes("SELLER");

  // Chỉ fetch wallet khi đã đăng nhập
  const { data: wallet } = useWalletBalance(isAuthenticated);

  // Logout dùng cho mobile menu (desktop đã dùng UserMenu → LogoutDialog)
  const handleMobileLogout = async () => {
    setMobileOpen(false);
    try {
      await authApi.logout();
    } finally {
      clearAuthSession();
      navigate("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md transition-all duration-300 select-none">
      <div className="mx-auto flex h-[4.25rem] max-w-[1280px] items-center justify-between px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link to="/" className="group flex shrink-0 items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded ring-1 ring-primary/30 transition-all group-hover:ring-primary/60">
              <img
                src={logoUrl}
                alt="WoodCert Logo"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
              WoodCert
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Điều hướng chính">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  [
                    "text-sm font-semibold transition-colors duration-200",
                    isActive ? "text-primary" : "text-foreground/70 hover:text-primary",
                  ].join(" ")
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Auth + Wallet + UserMenu */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Ví: hiển thị số dư thật, mặc định 0 khi chưa load */}
              <WalletWidget
                availableBalance={wallet?.availableBalance ?? 0}
                frozenBalance={wallet?.frozenBalance ?? 0}
              />

              {/* Avatar dropdown (tên thật + 2 lựa chọn + logout dialog) */}
              <UserMenu onMobileClose={() => setMobileOpen(false)} />
            </>
          ) : isAuthLoading ? null : (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                to="/auth/login"
                className="text-sm font-bold text-foreground/80 transition-colors hover:text-primary px-4"
              >
                Đăng nhập
              </Link>
              <Link
                to="/auth/register"
                className="rounded bg-primary px-6 py-2 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
              >
                Đăng ký
              </Link>
            </div>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-md p-2 text-foreground/70 transition-colors hover:bg-white/6 hover:text-foreground lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-slide-down border-t border-white/8 bg-background/95 pb-4 lg:hidden">
          <nav className="flex flex-col px-6 pt-2" aria-label="Menu di động">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="border-b border-white/6 py-3 text-sm font-semibold text-foreground/70 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-2 px-6">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/20 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    Khu quản trị (Admin)
                  </Link>
                )}
                {isAppraiser && (
                  <Link
                    to="/appraiser/products"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/20 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    Khu kiểm định
                  </Link>
                )}
                {isSeller ? (
                  <Link
                    to="/seller/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/20 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    Khu người bán
                  </Link>
                ) : (
                  !isAdmin &&
                  !isAppraiser && (
                    <Link
                      to="/seller/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/20 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      Đăng ký người bán
                    </Link>
                  )
                )}

                <Link
                  to="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg border border-white/12 py-2.5 px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
                >
                  Hồ sơ cá nhân
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg border border-white/12 py-2.5 px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
                >
                  Đơn mua
                </Link>
                {/* Mobile logout không dùng dialog để giảm UX friction trên mobile */}
                <button
                  type="button"
                  onClick={handleMobileLogout}
                  className="flex items-center justify-center gap-2 rounded-lg border border-destructive/30 py-2.5 text-sm font-medium text-destructive"
                >
                  Đăng xuất
                </button>
              </>
            ) : isAuthLoading ? null : (
              <>
                <Link
                  to="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-white/12 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:border-primary/40"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground"
                >
                  Đăng ký ngay
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
