/**
 * Card trạng thái seller ở trang tài khoản.
 *
 * Sau khi tải hồ sơ seller, card này sẽ mời người dùng đăng ký seller hoặc dẫn
 * seller đã có hồ sơ vào khu quản lý seller.
 */
import type { ReactNode } from "react";
import { ArrowRight, LayoutDashboard, Package, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

import { SELLER_PATHS } from "@/shared/constants";
import { Button } from "@/shared/ui/button";

import type { SellerProfile } from "../types";

interface SellerStatusCardProps {
  sellerProfile: SellerProfile | undefined;
  isLoading: boolean;
}

interface StatusConfig {
  icon: ReactNode;
  badge: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}

const VERIFIED_SELLER_CONFIG: StatusConfig = {
  icon: <ShieldCheck className="h-7 w-7 text-primary" aria-hidden />,
  badge: (
    <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
      Đã kích hoạt
    </span>
  ),
  title: "Hồ sơ người bán",
  description:
    "Tài khoản của bạn đã có hồ sơ người bán. Bạn có thể truy cập seller portal để quản lý sản phẩm và phiên đấu giá.",
  actions: (
    <div className="flex flex-wrap gap-3">
      <Button asChild size="sm" className="gap-2 text-primary-foreground">
        <Link to={SELLER_PATHS.dashboard} target="_blank" rel="noopener noreferrer">
          <LayoutDashboard className="h-4 w-4" />
          Truy cập Dashboard
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link to={SELLER_PATHS.products} target="_blank" rel="noopener noreferrer">
          <Package className="h-4 w-4" />
          Quản lý kho hàng
        </Link>
      </Button>
    </div>
  ),
};

export function SellerStatusCard({ sellerProfile, isLoading }: SellerStatusCardProps) {
  if (isLoading) {
    return (
      <section
        aria-busy="true"
        aria-label="Đang tải thông tin người bán"
        className="h-28 animate-pulse rounded-xl border border-border/40 bg-card"
      />
    );
  }

  if (!sellerProfile) {
    return (
      <section
        aria-labelledby="seller-cta-heading"
        className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-7 shadow-sm"
      >
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
            <Link to={SELLER_PATHS.register}>
              Đăng ký ngay
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const config = VERIFIED_SELLER_CONFIG;

  return (
    <section
      aria-labelledby="seller-status-heading"
      className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
    >
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
