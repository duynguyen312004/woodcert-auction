/**
 * Trang chi tiết hồ sơ seller.
 *
 * Hiển thị thông tin gian hàng, giấy tờ đã được che bớt, điểm uy tín và các mốc
 * thời gian của hồ sơ.
 */
import {
  Building2,
  CalendarDays,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  ShieldCheck,
  Star,
} from "lucide-react";

import { useProfile, useSellerProfile } from "@/features/account";
import { formatDate } from "@/shared/lib/format";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";

// Hàm hỗ trợ.

function maskId(value: string) {
  if (value.length <= 4) return value;
  return "*".repeat(value.length - 4) + value.slice(-4);
}

// Dòng hiển thị một thông tin.

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  highlight,
  action,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-[#4e4637]/10 last:border-0">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F6F0E6]">
        <Icon className="size-4 text-muted-warm" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-warm mb-0.5">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-semibold truncate",
              highlight ? "text-brushed-brass" : "text-ink-blue",
              mono && "font-mono",
            )}
          >
            {value}
          </p>
          {action}
        </div>
      </div>
    </div>
  );
}

// Skeleton khi đang tải.

function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-[#4e4637]/10 last:border-0">
      <div className="size-8 rounded-lg bg-[#eae1d6] animate-pulse shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="h-2.5 w-20 rounded bg-[#eae1d6] animate-pulse" />
        <div className="h-4 w-40 rounded bg-[#eae1d6] animate-pulse" />
      </div>
    </div>
  );
}

// Trang chính.

export function SellerProfilePage() {
  const { data: profile, isPending: profileLoading } = useProfile();
  const { data: sellerProfile, isPending: sellerLoading } = useSellerProfile();
  const [isIdentityVisible, setIsIdentityVisible] = useState(false);

  const isLoading = profileLoading || sellerLoading;

  const reputationLabel =
    sellerProfile?.reputationScore != null
      ? `${Number(sellerProfile.reputationScore).toFixed(1)} / 5.0`
      : "—";

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="h-[68px] sticky top-0 z-10 bg-warm-ivory/80 backdrop-blur-md border-b border-[#4e4637]/20 flex items-center px-8 shrink-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-warm">
            Seller Portal
          </p>
          <h1 className="font-serif text-lg font-bold text-ink-blue leading-tight">
            Hồ sơ gian hàng
          </h1>
        </div>
      </header>

      {/* Nội dung */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[800px] mx-auto space-y-8">
          {/* Banner thông tin chính */}
          <section className="animate-fade-in-up bg-white border border-[#4e4637]/15 rounded-xl p-6 flex items-center gap-6 shadow-sm">
            <div
              className="size-20 rounded-full border-2 border-brushed-brass shrink-0 overflow-hidden bg-[#eae1d6] flex items-center justify-center"
              aria-hidden
            >
              {isLoading ? (
                <div className="size-full animate-pulse bg-[#d8d0c8]" />
              ) : profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-brushed-brass">
                  {(profile?.fullName ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-6 w-48 rounded bg-[#eae1d6] animate-pulse" />
                  <div className="h-3.5 w-32 rounded bg-[#eae1d6] animate-pulse" />
                </div>
              ) : (
                <>
                  <h2 className="font-serif text-2xl font-bold text-ink-blue leading-tight">
                    {sellerProfile?.storeName ?? profile?.fullName ?? "—"}
                  </h2>
                  <p className="text-sm text-muted-warm mt-0.5">{profile?.email}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brushed-brass/10 border border-brushed-brass/20 rounded-full text-xs font-bold text-brushed-brass">
                      <Star className="size-3 fill-brushed-brass" aria-hidden />
                      {reputationLabel} Uy tín
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-verdigris/10 border border-verdigris/20 rounded-full text-xs font-bold text-verdigris">
                      <ShieldCheck className="size-3" aria-hidden />
                      Người bán đã xác thực
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Chi tiết hồ sơ seller */}
          <section
            className="animate-fade-in-up [animation-delay:0.1s] bg-white border border-[#4e4637]/15 rounded-xl overflow-hidden shadow-sm"
            aria-labelledby="seller-detail-heading"
          >
            <div className="flex items-center gap-2.5 border-b border-[#4e4637]/10 px-6 py-4 bg-[#F6F0E6]/30">
              <Building2 className="size-4 text-brushed-brass" aria-hidden />
              <h2
                id="seller-detail-heading"
                className="font-serif text-base font-bold text-ink-blue"
              >
                Thông tin gian hàng
              </h2>
            </div>

            <div className="px-6 pb-2">
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (
                <>
                  <InfoRow
                    icon={Building2}
                    label="Tên gian hàng"
                    value={sellerProfile?.storeName ?? "—"}
                    highlight
                  />
                  <InfoRow
                    icon={CreditCard}
                    label="CCCD / CMND"
                    value={
                      sellerProfile
                        ? isIdentityVisible
                          ? sellerProfile.identityCardNumber
                          : maskId(sellerProfile.identityCardNumber)
                        : "—"
                    }
                    mono
                    action={
                      sellerProfile && (
                        <button
                          type="button"
                          onClick={() => setIsIdentityVisible(!isIdentityVisible)}
                          className="text-muted-warm hover:text-ink-blue transition-colors cursor-pointer focus:outline-none"
                          aria-label={
                            isIdentityVisible ? "Ẩn số CCCD/CMND" : "Hiển thị số CCCD/CMND"
                          }
                        >
                          {isIdentityVisible ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      )
                    }
                  />
                  <InfoRow
                    icon={FileText}
                    label="Mã số thuế"
                    value={sellerProfile?.taxCode ?? "Không có"}
                    mono
                  />
                  <InfoRow icon={Star} label="Điểm uy tín" value={reputationLabel} />
                  <InfoRow
                    icon={CalendarDays}
                    label="Ngày đăng ký bán"
                    value={formatDate(sellerProfile?.createdAt)}
                  />
                  <InfoRow
                    icon={CalendarDays}
                    label="Cập nhật lần cuối"
                    value={formatDate(sellerProfile?.updatedAt)}
                  />
                </>
              )}
            </div>

            <div className="mx-6 mb-6 mt-2 rounded-lg border border-ink-blue/15 bg-ink-blue/5 p-3">
              <p className="text-xs text-muted-warm leading-relaxed">
                Thông tin pháp lý được xác thực bởi WoodCert và không thể chỉnh sửa sau khi tạo hồ
                sơ. Nếu cần cập nhật hoặc tư vấn thêm, vui lòng liên hệ hotline:{" "}
                <strong className="text-ink-blue">1900 8888</strong> hoặc gửi email về:{" "}
                <a
                  href="mailto:support@woodcert.vn"
                  className="text-brushed-brass font-semibold hover:underline"
                >
                  support@woodcert.vn
                </a>
                .
              </p>
            </div>
          </section>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-brushed-brass" aria-hidden />
              <span className="sr-only">Đang tải hồ sơ...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
