/**
 * Cột sản phẩm trong phòng đấu giá realtime.
 *
 * Hiển thị ảnh đại diện lớn, trạng thái kiểm định và các thông tin đấu giá cốt lõi.
 * Thông tin sản phẩm chi tiết được mở trong ProductDetailDialog để không làm rối cockpit.
 */

import { FileText, ShieldCheck } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import type { BiddingAuctionDetail } from "../types";
import { ProductDetailDialog } from "./ProductDetailDialog";

interface ProductPanelProps {
  detail: BiddingAuctionDetail;
  className?: string;
}

export function ProductPanel({ detail, className }: ProductPanelProps) {
  const product = detail.product;
  const primaryImage = product?.primaryImage || "/assets/hero/woodcert-card-fallback.jpg";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  return (
    <div
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col overflow-y-auto border-r bg-card",
        className,
      )}
    >
      <div className="relative h-[340px] w-full overflow-hidden border-b bg-background/70">
        <img
          src={primaryImage}
          alt={product?.title || "Sản phẩm gỗ"}
          className="h-full w-full object-contain p-2 transition-transform duration-500 hover:scale-[1.02]"
        />
        {product?.isAuthentic && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded bg-verdigris px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Đã kiểm định
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-4">
        <div>
          <h2 className="line-clamp-2 text-sm font-bold tracking-tight text-foreground">
            {product?.title || "Tác phẩm gỗ mỹ nghệ"}
          </h2>
          <span className="text-[11px] text-muted-foreground">ID sản phẩm: #{product?.id}</span>
        </div>

        <ProductDetailDialog detail={detail} />

        {product?.certificateCode && (
          <div className="rounded-lg border border-verdigris/10 bg-verdigris/5 p-3">
            <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-verdigris">
              <FileText className="h-3 w-3" aria-hidden />
              Mã kiểm định
            </div>
            <div className="font-mono text-xs font-bold text-verdigris">
              {product.certificateCode}
            </div>
          </div>
        )}

        <hr className="border-border/60" />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Giá khởi điểm:</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(detail.startingPrice)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tiền đặt trước:</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(detail.depositAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Bước giá tối thiểu:</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(detail.stepPrice)}
            </span>
          </div>
        </div>

        {detail.seller && (
          <>
            <hr className="border-border/60" />
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Thông tin nhà bán hàng
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{detail.seller.storeName}</span>
                <span className="rounded bg-brushed-brass/15 px-1.5 py-0.5 font-bold text-brushed-brass">
                  {detail.seller.reputationScore} ★
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
