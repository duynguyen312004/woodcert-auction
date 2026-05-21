/**
 * Card đấu giá dùng ở các màn public.
 *
 * Component này có cả kiểu nền tối ở trang home và kiểu sáng ở trang danh sách.
 * Phần badge thời gian nằm ở đây để card tự đổi khi phiên sắp kết thúc.
 */
import { ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { formatTimeRemaining } from "@/shared/hooks/useCountdown";
import { formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

import { AUCTION_STATUS_LABEL } from "../constants/auctionStatus";
import type { ArtAuction } from "../types";

interface ArtAuctionCardProps {
  auction: ArtAuction;
  cardTheme?: "dark" | "light";
}

const ENDING_SOON_MS = 6 * 60 * 60 * 1000;

// Nếu còn dưới 6 tiếng thì hiển thị trạng thái "sắp kết thúc".
function getStatusBadge(auction: ArtAuction, now: number, theme: "dark" | "light") {
  if (auction.status === "WAITING") {
    return {
      label: AUCTION_STATUS_LABEL.WAITING,
      className: theme === "light" ? "bg-stone-400 text-white" : "bg-sky-500 text-white",
      dot: false,
    };
  }

  if (auction.status === "ACTIVE") {
    const endTimestamp = new Date(auction.endTime).getTime();
    const isEndingSoon = !Number.isNaN(endTimestamp) && endTimestamp - now <= ENDING_SOON_MS;

    if (isEndingSoon) {
      return {
        label: "Sắp kết thúc",
        className: "bg-red-500 text-white",
        dot: false,
      };
    }

    return {
      label: AUCTION_STATUS_LABEL.ACTIVE,
      className: theme === "light" ? "bg-[#B5533E] text-white" : "bg-emerald-500 text-white",
      dot: theme === "dark",
    };
  }

  return {
    label: AUCTION_STATUS_LABEL[auction.status],
    className: theme === "light" ? "bg-stone-300 text-stone-600" : "bg-white/20 text-white/80",
    dot: false,
  };
}

export function ArtAuctionCard({ auction, cardTheme = "dark" }: ArtAuctionCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const isEnding =
    auction.status === "ACTIVE" &&
    new Date(auction.endTime).getTime() - now <= ENDING_SOON_MS &&
    !Number.isNaN(new Date(auction.endTime).getTime());

  const timeRemaining = useMemo(() => {
    const target = auction.status === "WAITING" ? auction.startTime : auction.endTime;
    return formatTimeRemaining(target, now, { separator: " : ", showDays: true });
  }, [auction.status, auction.startTime, auction.endTime, now]);

  const badge = useMemo(() => getStatusBadge(auction, now, cardTheme), [auction, now, cardTheme]);

  if (cardTheme === "light") {
    return (
      <article className="group flex flex-col overflow-hidden rounded-sm border border-stone-200 bg-white transition-all duration-300 hover:shadow-xl">
        <div className="relative aspect-[4/5] overflow-hidden">
          {auction.isAuthentic && (
            <div className="absolute left-4 top-4 z-10 flex items-center gap-1 bg-[#2F7D68] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              <ShieldCheck className="h-3 w-3" style={{ fill: "currentColor" }} />
              Verified
            </div>
          )}

          <div
            className={cn(
              "absolute right-4 top-4 z-10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest",
              badge.className,
            )}
          >
            {badge.label}
          </div>

          {!imageFailed ? (
            <img
              src={auction.imageUrl}
              alt={auction.title}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-stone-200 to-stone-100" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Chất liệu: {auction.woodType}
          </span>
          <h3 className="mb-3 font-serif text-xl font-bold leading-tight text-[#0F0F0D] line-clamp-2">
            {auction.title}
          </h3>

          <div className="mt-auto">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-stone-400">
                  {auction.status === "WAITING" ? "Giá khởi điểm" : "Giá hiện tại"}
                </p>
                <p className="font-serif text-2xl font-bold text-primary">
                  {formatVND(auction.currentPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-stone-400">
                  {auction.status === "WAITING" ? "Quan tâm" : "Lượt đấu"}
                </p>
                <p className="font-bold text-[#0F0F0D]">{auction.bidCount}</p>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 bg-stone-50 p-2">
              <span className="text-stone-400">
                {auction.status === "WAITING" ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </span>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  isEnding ? "text-red-500" : "text-stone-600",
                )}
              >
                {auction.status === "WAITING" ? "Thông báo khi mở" : timeRemaining}
              </span>
            </div>

            <Link
              to={`/auctions/${auction.id}`}
              className={cn(
                "block w-full py-3 text-center text-xs font-bold uppercase tracking-widest transition-all duration-300",
                auction.status === "WAITING"
                  ? "cursor-not-allowed bg-stone-200 text-stone-500"
                  : "bg-[#171717] text-white hover:shadow-[0_0_15px_rgba(214,168,79,0.4)]",
              )}
            >
              {auction.status === "WAITING" ? "Chưa bắt đầu" : "Xem phiên"}
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-card transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
      <div className="relative aspect-[4/5] overflow-hidden">
        <div className="absolute left-4 top-4 z-10">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tight",
              badge.className,
            )}
          >
            {badge.dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
            {badge.label}
          </span>
        </div>

        {!imageFailed ? (
          <img
            src={auction.imageUrl}
            alt={auction.title}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-stone-800 to-stone-700" />
        )}

        {auction.isAuthentic && (
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded border border-primary/30 bg-background/80 px-2.5 py-1.5 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
              WoodCert Verified
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
          Chất liệu: {auction.woodType}
        </span>
        <h3 className="mb-4 font-serif text-xl font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2">
          {auction.title}
        </h3>

        <div className="mb-4 flex items-center justify-between border-y border-white/10 py-4">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Giá hiện tại
            </p>
            <p className="font-serif text-xl font-bold text-primary">
              {formatVND(auction.currentPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Thời gian còn lại
            </p>
            <p
              className={cn(
                "font-sans text-sm font-bold",
                isEnding ? "text-red-400" : "text-foreground",
              )}
            >
              {timeRemaining}
            </p>
          </div>
        </div>

        <Link
          to={`/auctions/${auction.id}`}
          className="block w-full rounded bg-card/80 py-3 text-center text-sm font-bold text-foreground ring-1 ring-white/10 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:ring-primary hover:shadow-lg hover:shadow-primary/20"
        >
          Đặt giá ngay
        </Link>
      </div>
    </article>
  );
}
