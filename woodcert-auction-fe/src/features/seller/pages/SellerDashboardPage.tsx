/**
 * Trang dashboard của khu seller.
 *
 * Đây là màn đầu tiên sau khi seller vào portal. Trang gom thông tin gian hàng,
 * KPI, thao tác nhanh, phiên đang chạy và sản phẩm gần đây.
 */
import { AlertTriangle, ArrowRight, Gavel, PackagePlus, RefreshCw, Star } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router";

import { useProfile, useSellerProfile } from "@/features/account/hooks/useProfile";

import { ActiveAuctionWidget } from "../components/ActiveAuctionWidget";
import { KpiCard } from "../components/KpiCard";
import { ProductRow } from "../components/ProductRow";
import { ProductTableSkeleton } from "../components/ProductTableSkeleton";
import { SELLER_PATHS } from "../constants/routes";
import { useSellerDashboard } from "../hooks/useSellerDashboard";

export function SellerDashboardPage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: sellerProfile } = useSellerProfile();

  const { stats, recentProducts, activeAuction, isLoading, isError, refetch } =
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
          <p className="font-serif text-lg font-bold text-ink-blue">Không thể tải dữ liệu</p>
          <p className="text-sm text-muted-warm mt-1">Đã xảy ra lỗi khi tải thông tin dashboard.</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 border border-ink-blue/30 rounded-lg text-sm font-semibold text-ink-blue hover:bg-ink-blue/5 transition-colors"
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
          <h2 className="font-serif text-xl font-bold tracking-tight text-ink-blue">{storeName}</h2>
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
            className="size-9 rounded-full bg-cover bg-center border-2 border-brushed-brass overflow-hidden bg-[#eae1d6] flex items-center justify-center transition-opacity hover:opacity-80"
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
          <section aria-label="Thống kê nhanh" className="grid grid-cols-4 gap-6">
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
              label="Đã kiểm định"
              value={stats.appraisedCount}
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
          </section>

          {/* Quản lý nhanh và phiên đang chạy */}
          <section
            aria-label="Quản lý nhanh"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            <div className="lg:col-span-2 flex flex-col gap-5">
              <h3 className="font-serif text-xl font-bold text-ink-blue">Quản lý nhanh</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => navigate(SELLER_PATHS.newProduct)}
                  className="h-32 bg-brushed-brass text-[#181612] rounded-xl flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 hover:brightness-105 shadow-md"
                >
                  <PackagePlus className="size-7" />
                  <span className="font-bold text-sm">Đăng sản phẩm mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(SELLER_PATHS.newAuction)}
                  className="h-32 bg-ink-blue text-white rounded-xl flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 hover:brightness-110 shadow-md"
                >
                  <Gavel className="size-7" />
                  <span className="font-bold text-sm">Tạo phiên đấu giá</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-serif text-xl font-bold text-ink-blue">Phiên đang diễn ra</h3>
              <ActiveAuctionWidget auction={activeAuction} />
            </div>
          </section>

          {/* Bảng sản phẩm gần đây */}
          <section aria-label="Sản phẩm gần đây" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-ink-blue">Sản phẩm gần đây</h3>
              <Link
                to={SELLER_PATHS.products}
                className="text-sm font-bold text-ink-blue/50 hover:text-ink-blue transition-colors flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="bg-white border border-[#4e4637]/20 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F0E6]/60 border-b border-[#4e4637]/15">
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-warm uppercase tracking-widest">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-warm uppercase tracking-widest">
                      Chất liệu
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-warm uppercase tracking-widest">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-warm uppercase tracking-widest text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4e4637]/10">
                  {isLoading ? (
                    <ProductTableSkeleton />
                  ) : recentProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <PackagePlus className="size-10 text-[#8D877C]/30" />
                          <p className="text-sm text-muted-warm">Chưa có sản phẩm nào.</p>
                          <Link
                            to={SELLER_PATHS.newProduct}
                            className="text-sm font-bold text-brushed-brass hover:underline"
                          >
                            Đăng sản phẩm đầu tiên →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentProducts.map((product) => (
                      <ProductRow key={product.id} product={product} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
