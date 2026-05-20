import type { ReactNode } from "react";
import { ArrowRight, LayoutDashboard, Package, ShieldCheck } from "lucide-react";

import { Button } from "@/shared/ui/button";
import type { SellerProfile } from "../types";

interface SellerStatusCardProps {
  sellerProfile: SellerProfile | undefined;
  isLoading: boolean;
}

// Các link seller sẽ được kết nối khi implement seller routes
const SELLER_DASHBOARD_PATH = "/seller/dashboard"; // pending implementation
const SELLER_PRODUCTS_PATH = "/seller/products"; // pending implementation
const SELLER_REGISTER_PATH = "/seller/register"; // pending implementation

interface StatusConfig {
  icon: ReactNode;
  badge: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  APPROVED: {
    icon: <ShieldCheck className="h-7 w-7 text-primary" aria-hidden />,
    badge: (
      <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
        Đã xác minh
      </span>
    ),
    title: "Hồ sơ người bán",
    description:
      "Tài khoản của bạn đã được xác minh làm người bán. Bắt đầu niêm yết các tác phẩm gỗ quý ngay hôm nay.",
    actions: (
      <div className="flex flex-wrap gap-3">
        <Button asChild size="sm" className="gap-2 text-primary-foreground">
          <a href={SELLER_DASHBOARD_PATH}>
            <LayoutDashboard className="h-4 w-4" />
            Truy cập Dashboard
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={SELLER_PRODUCTS_PATH}>
            <Package className="h-4 w-4" />
            Quản lý kho hàng
          </a>
        </Button>
      </div>
    ),
  },
  PENDING: {
    icon: (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-400 text-amber-400">
        <span className="text-xs font-bold">!</span>
      </div>
    ),
    badge: (
      <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
        Đang xét duyệt
      </span>
    ),
    title: "Hồ sơ người bán",
    description:
      "Hồ sơ người bán của bạn đang được xét duyệt. Chúng tôi sẽ thông báo qua email khi có kết quả.",
  },
  REJECTED: {
    icon: (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-destructive text-destructive">
        <span className="text-xs font-bold">✕</span>
      </div>
    ),
    badge: (
      <span className="rounded bg-destructive/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
        Bị từ chối
      </span>
    ),
    title: "Hồ sơ người bán",
    description:
      "Hồ sơ người bán của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.",
  },
};

export function SellerStatusCard({ sellerProfile, isLoading }: SellerStatusCardProps) {
  // Skeleton khi đang load
  if (isLoading) {
    return (
      <section
        aria-busy="true"
        aria-label="Đang tải thông tin người bán"
        className="h-28 animate-pulse rounded-xl border border-border/40 bg-card"
      />
    );
  }

  // Người dùng chưa đăng ký làm người bán
  if (!sellerProfile) {
    return (
      <section
        aria-labelledby="seller-cta-heading"
        className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-7 shadow-sm"
      >
        {/* Gold accent line */}
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-primary" aria-hidden />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3
              id="seller-cta-heading"
              className="font-serif text-lg font-bold tracking-tight text-foreground"
            >
              Trở thành người bán
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Đăng ký hồ sơ người bán để niêm yết tác phẩm gỗ quý và tham gia vào cộng đồng nghệ
              nhân WoodCert.
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2 text-primary-foreground">
            <a href={SELLER_REGISTER_PATH}>
              Đăng ký ngay
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    );
  }

  const config = STATUS_CONFIG[sellerProfile.status ?? "APPROVED"] ?? STATUS_CONFIG.APPROVED;

  if (!config) return null;

  return (
    <section
      aria-labelledby="seller-status-heading"
      className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
    >
      {/* Header band */}
      <div className="flex items-center gap-3 border-b border-border/40 bg-background/60 px-6 py-4">
        {config.icon}
        <h3
          id="seller-status-heading"
          className="font-serif text-lg font-bold tracking-tight text-foreground"
        >
          {config.title}
        </h3>
        {config.badge}
      </div>

      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-sm text-muted-foreground">{config.description}</p>
        {config.actions}
      </div>
    </section>
  );
}
