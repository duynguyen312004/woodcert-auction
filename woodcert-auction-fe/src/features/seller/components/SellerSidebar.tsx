/**
 * Sidebar điều hướng cố định của khu seller.
 *
 * Lấy profile để hiện avatar/tên gian hàng và tự đánh dấu link đang mở.
 */
import { ArrowLeft, Gavel, LayoutDashboard, Package, ReceiptText, UserCircle } from "lucide-react";
import { Link, useLocation } from "react-router";

import { useProfile, useSellerProfile } from "@/features/account";
import { cn } from "@/shared/lib/utils";

import { SELLER_PATHS } from "../constants/routes";

const NAV_ITEMS = [
  { label: "Tổng quan", icon: LayoutDashboard, to: SELLER_PATHS.dashboard },
  { label: "Sản phẩm", icon: Package, to: SELLER_PATHS.products },
  { label: "Phiên đấu giá", icon: Gavel, to: SELLER_PATHS.auctions },
  { label: "Đơn bán", icon: ReceiptText, to: SELLER_PATHS.orders },
  { label: "Hồ sơ", icon: UserCircle, to: SELLER_PATHS.profile },
] as const;

function isNavItemActive(pathname: string, to: string) {
  if (to === SELLER_PATHS.dashboard) {
    return pathname === to;
  }

  if (to === SELLER_PATHS.products) {
    return pathname === to || pathname.startsWith(`${to}/`);
  }

  return pathname === to || pathname.startsWith(`${to}/`);
}

export function SellerSidebar() {
  const location = useLocation();
  const { data: profile } = useProfile();
  const { data: sellerProfile } = useSellerProfile();

  const displayName = sellerProfile?.storeName ?? profile?.fullName ?? "WoodCert";
  const initial = displayName.charAt(0).toUpperCase();

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
            <p className="text-muted-warm text-xs leading-tight">Seller Portal</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1" aria-label="Seller navigation">
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
      </div>
    </aside>
  );
}
