/**
 * Trang dashboard của khu seller.
 *
 * Đây là màn đầu tiên sau khi seller vào portal. Trang gom thông tin gian hàng,
 * KPI, thao tác nhanh, phiên đang chạy và sản phẩm gần đây.
 */
import {
  AlertTriangle,
  ArrowRight,
  Gavel,
  PackagePlus,
  RefreshCw,
  Star,
  WalletCards,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router";

import { useProfile, useSellerProfile } from "@/features/account";
import { formatVND } from "@/shared/lib/format";

import { ActiveAuctionWidget } from "../components/ActiveAuctionWidget";
import { KpiCard } from "../components/KpiCard";
import { useSellerCapability } from "../components/SellerCapabilityProvider";
import { SELLER_PATHS } from "../constants/routes";
import { useSellerDashboard } from "../hooks/useSellerDashboard";

export function SellerDashboardPage() {
  const navigate = useNavigate();
  const { isSuspended } = useSellerCapability();
  const { data: profile } = useProfile();
  const { data: sellerProfile } = useSellerProfile();

  const { stats, activeAuction, realizedIncome30D, isLoading, isError, refetch } =
    useSellerDashboard();

  const storeName = useMemo(
    () => sellerProfile?.storeName ?? profile?.fullName ?? "Cửa hàng của bạn",
    [sellerProfile, profile],
  );

  const reputation = useMemo(
    () =>
      sellerProfile?.reputationScore != null
        ? `${sellerProfile.reputationScore.toFixed(1)} / 5.0`
        : null,
    [sellerProfile],
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
        <AlertTriangle className="size-10 text-terracotta" />
        <div>
          <p className="font-sans text-lg font-bold text-ink-blue">Không thể tải dữ liệu</p>
          <p className="text-sm text-muted-warm mt-1">Đã xảy ra lỗi khi tải thông tin dashboard.</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="flex cursor-pointer items-center gap-2 px-4 py-2 border border-ink-blue/30 rounded-lg text-sm font-semibold text-ink-blue hover:bg-ink-blue/5 transition-colors"
        >
          <RefreshCw className="size-4" />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="h-[68px] sticky top-0 z-10 bg-warm-ivory/80 backdrop-blur-md border-b border-[#4e4637]/20 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          <svg
            className="size-6 text-ink-blue shrink-0"
            fill="none"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              clipRule="evenodd"
              d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z"
              fill="currentColor"
              fillRule="evenodd"
            />
          </svg>
          <h2 className="font-sans text-xl font-bold tracking-tight text-ink-blue">{storeName}</h2>
        </div>

        <div className="flex items-center gap-4">
          {reputation && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-brushed-brass/10 border border-brushed-brass/20 rounded-full">
              <Star className="size-4 text-brushed-brass fill-brushed-brass" />
              <span className="text-xs font-bold text-ink-blue tracking-tight">
                {reputation} Uy tín
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate(SELLER_PATHS.profile)}
            aria-label="Xem hồ sơ người bán"
            className="size-9 cursor-pointer rounded-full bg-cover bg-center border-2 border-brushed-brass overflow-hidden bg-[#eae1d6] flex items-center justify-center transition-opacity hover:opacity-80"
            style={profile?.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})` } : {}}
          >
            {!profile?.avatarUrl && (
              <span className="text-xs font-bold text-brushed-brass">
                {(profile?.fullName ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Nội dung */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1280px] mx-auto space-y-8">
          {/* Dải chỉ số nhanh */}
          <section
            aria-label="Thống kê nhanh"
            className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6"
          >
            <KpiCard
              label="Bản nháp"
              value={stats.draftCount}
              valueClass="text-ink-blue"
              accentClass="group-hover:bg-brushed-brass"
              isLoading={isLoading}
            />
            <KpiCard
              label="Chờ kiểm định"
              value={stats.pendingAppraisalCount}
              valueClass="text-ink-blue"
              accentClass="group-hover:bg-brushed-brass"
              isLoading={isLoading}
            />
            <KpiCard
              label="Sẵn sàng đấu giá"
              value={stats.auctionReadyCount}
              valueClass="text-verdigris"
              accentClass="group-hover:bg-verdigris"
              isLoading={isLoading}
            />
            <KpiCard
              label="Phiên đang chạy"
              value={stats.activeAuctionCount}
              valueClass="text-terracotta"
              accentClass="group-hover:bg-terracotta"
              isLoading={isLoading}
            />
            <KpiCard
              label="Đơn chờ giao"
              value={stats.pendingShipmentCount}
              valueClass="text-brushed-brass"
              accentClass="group-hover:bg-brushed-brass"
              isLoading={isLoading}
            />
            <KpiCard
              label="Đang tranh chấp"
              value={stats.disputedOrderCount}
              valueClass="text-terracotta"
              accentClass="group-hover:bg-terracotta"
              isLoading={isLoading}
            />
          </section>

          {/* Doanh thu đối soát và Phiên đang diễn ra */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div className="flex flex-col gap-3 lg:col-span-1">
              <h3 className="font-sans text-xl font-bold text-ink-blue">Doanh thu đối soát</h3>
              <Link
                to={SELLER_PATHS.revenue}
                className="rounded-xl border border-ink-blue bg-ink-blue p-6 text-white shadow-lg transition-transform hover:-translate-y-0.5 flex flex-col justify-between flex-1 min-h-[220px]"
              >
                <div className="flex-1 flex flex-col justify-center">
                  <WalletCards className="size-8 text-brushed-brass" />
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#d2c5b2]">
                    Thu nhập thực tế 30 ngày
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {formatVND(realizedIncome30D)}
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-brushed-brass border-t border-white/10 pt-4">
                  Xem báo cáo doanh thu <ArrowRight className="size-3.5" />
                </span>
              </Link>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-2">
              <h3 className="font-sans text-xl font-bold text-ink-blue">Phiên đang diễn ra</h3>
              <div className="flex-1 flex flex-col justify-stretch">
                <ActiveAuctionWidget auction={activeAuction} />
              </div>
            </div>
          </section>

          {/* Quản lý nhanh */}
          <section aria-label="Quản lý nhanh" className="space-y-4">
            <h3 className="font-sans text-xl font-bold text-ink-blue">Quản lý nhanh</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => !isSuspended && navigate(SELLER_PATHS.newProduct)}
                disabled={isSuspended}
                title={isSuspended ? "Quyền bán đang bị đình chỉ" : undefined}
                className="h-32 cursor-pointer bg-brushed-brass text-[#181612] rounded-xl flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 hover:brightness-105 shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PackagePlus className="size-8" />
                <span className="font-bold text-base">Đăng sản phẩm mới</span>
              </button>
              <button
                type="button"
                onClick={() => !isSuspended && navigate(SELLER_PATHS.newAuction)}
                disabled={isSuspended}
                title={isSuspended ? "Quyền bán đang bị đình chỉ" : undefined}
                className="h-32 cursor-pointer bg-ink-blue text-white rounded-xl flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 hover:brightness-110 shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Gavel className="size-8" />
                <span className="font-bold text-base">Tạo phiên đấu giá</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
