/**
 * Sidebar điều hướng cố định của khu seller.
 *
 * Lấy profile để hiện avatar/tên gian hàng và tự đánh dấu link đang mở.
 */
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  Gavel,
  LayoutDashboard,
  Package,
  Plus,
  ReceiptText,
  UserCircle,
  WalletCards,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import { useProfile, useSellerProfile } from "@/features/account";
import { useWalletBalance } from "@/features/wallet";
import { formatCompactVND, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

import { SELLER_PATHS } from "../constants/routes";

const NAV_ITEMS = [
  { label: "Tổng quan", icon: LayoutDashboard, to: SELLER_PATHS.dashboard },
  { label: "Sản phẩm", icon: Package, to: SELLER_PATHS.products },
  { label: "Phiên đấu giá", icon: Gavel, to: SELLER_PATHS.auctions },
  { label: "Đơn bán", icon: ReceiptText, to: SELLER_PATHS.orders },
  { label: "Doanh thu", icon: ChartNoAxesCombined, to: SELLER_PATHS.revenue },
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
  const walletQuery = useWalletBalance();

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

        <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
          <Link
            to="/wallet"
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-3.5 transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            aria-label="Mở trang quản lý ví"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#d2c5b2]">
                <WalletCards className="size-4 text-primary" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Ví seller</span>
              </div>
              <ArrowUpRight
                className="size-3.5 text-muted-warm transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                aria-hidden
              />
            </div>
            <p className="mt-3 text-[10px] font-medium text-muted-warm">Số dư khả dụng</p>
            {walletQuery.isPending ? (
              <div className="mt-1.5 h-6 w-28 animate-pulse rounded bg-white/10" />
            ) : (
              <>
                <p className="mt-1 font-mono text-base font-bold text-[#f2eee5]">
                  {formatCompactVND(walletQuery.data?.availableBalance ?? 0)}
                </p>
                <p className="mt-1 truncate text-[10px] text-muted-warm">
                  {formatVND(walletQuery.data?.availableBalance ?? 0)}
                </p>
              </>
            )}
          </Link>
          <Link
            to="/wallet/deposit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 border-t border-white/10 bg-primary/10 px-3 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          >
            <Plus className="size-3.5" aria-hidden />
            Nạp tiền
          </Link>
        </section>
      </div>
    </aside>
  );
}
