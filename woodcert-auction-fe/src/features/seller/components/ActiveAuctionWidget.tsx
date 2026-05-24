/**
 * Widget phiên đấu giá đang chạy trên dashboard seller.
 *
 * Nếu có phiên active thì hiển thị đếm ngược và giá hiện tại. Nếu chưa có thì
 * hiện nút gợi ý tạo phiên mới.
 */
import { ArrowRight, Clock, Gavel } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { useCountdown } from "@/shared/hooks/useCountdown";
import { formatVND } from "@/shared/lib/format";

import { SELLER_PATHS } from "../constants/routes";
import type { SellerAuction } from "../types";

export function ActiveAuctionWidget({ auction }: { auction: SellerAuction | null }) {
  const countdown = useCountdown(auction?.endTime);
  const [imgFailed, setImgFailed] = useState(false);

  if (!auction) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-[#4e4637]/20 bg-white p-8 text-center shadow-lg">
        <Gavel className="size-10 text-[#8D877C]/40" />
        <div>
          <p className="font-serif text-sm font-semibold text-ink-blue">Không có phiên đang chạy</p>
          <p className="mt-1 text-xs text-muted-warm">Tạo phiên đấu giá mới để bắt đầu</p>
        </div>
        <Link
          to={SELLER_PATHS.newAuction}
          className="flex cursor-pointer items-center gap-1 text-sm font-bold text-brushed-brass hover:underline"
        >
          Tạo phiên <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#4e4637]/20 bg-white shadow-lg">
      <div className="relative h-36 bg-[#eae1d6] bg-cover bg-center">
        {auction.imageUrl && !imgFailed ? (
          <img
            src={auction.imageUrl}
            alt={auction.title}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#2E4A62]/20 to-[#D6A84F]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <span className="rounded bg-terracotta px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
            Live Now
          </span>
          <h4 className="mt-1 line-clamp-1 text-base font-semibold text-white drop-shadow">
            {auction.title}
          </h4>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-warm">
              Giá hiện tại
            </p>
            <p className="font-serif text-xl font-bold text-terracotta">
              {formatVND(auction.currentPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-warm">
              Lượt đấu
            </p>
            <p className="font-serif text-xl font-bold text-ink-blue">{auction.bidCount}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#4e4637]/10 pt-3">
          <div className="flex items-center gap-2 text-ink-blue">
            <Clock className="size-4" />
            <span className="text-sm font-bold tabular-nums">{countdown}</span>
          </div>
          <Link
            to={SELLER_PATHS.auctions}
            className="flex cursor-pointer items-center gap-1 text-sm font-bold text-brushed-brass hover:underline"
          >
            Xem chi tiết <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
