/**
 * BidFeed Component.
 *
 * Hiển thị danh sách lịch sử trả giá dưới dạng feed scroll nội bộ.
 * Các lượt bid của chính user hiện tại (mine === true) sẽ được highlight viền
 * vàng và có tag chỉ thị để dễ theo dõi.
 */

import { Flame } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { BidHistoryItem } from "../types";

interface BidFeedProps {
  bids: BidHistoryItem[];
  className?: string;
}

export function BidFeed({ bids, className }: BidFeedProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className={cn("flex flex-1 flex-col overflow-hidden bg-background", className)}>
      {/* Tiêu đề feed */}
      <div className="flex items-center gap-1.5 border-b bg-muted/10 px-6 py-3 shrink-0">
        <Flame className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
          Lịch sử trả giá ({bids.length})
        </span>
      </div>

      {/* Danh sách feed */}
      {bids.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground p-8">
          Chưa có lượt trả giá nào được ghi nhận.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {bids.map((bid) => (
            <div
              key={bid.bidTraceId}
              className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-300 shadow-sm ${
                bid.mine
                  ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-amber-500/5"
                  : "bg-card hover:bg-muted/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    bid.mine ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {bid.bidderMaskedAlias ? bid.bidderMaskedAlias.slice(0, 2).toUpperCase() : "**"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {bid.bidderMaskedAlias}
                    </span>
                    {bid.mine && (
                      <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                        Lượt của bạn
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Mã lượt: {bid.bidTraceId}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold font-mono text-foreground">
                  {formatCurrency(bid.bidAmount)}
                </div>
                <div className="text-[10px] text-muted-foreground">{formatTime(bid.bidTime)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
