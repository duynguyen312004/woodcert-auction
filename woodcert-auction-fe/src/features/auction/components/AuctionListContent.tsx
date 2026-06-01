import { BadgeCheck, Gavel, RotateCcw, SearchX, TreePine } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { ArtAuction } from "../types";
import { ArtAuctionCard } from "./ArtAuctionCard";

type AuctionListContentProps = {
  auctions: ArtAuction[];
  isLoading: boolean;
  isError: boolean;
  cardTheme?: "dark" | "light";
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
};

export function AuctionListContent({
  auctions,
  isLoading,
  isError,
  cardTheme = "dark",
  hasActiveFilters = false,
  onResetFilters,
}: AuctionListContentProps) {
  const gap = cardTheme === "light" ? "gap-8" : "gap-6";
  const skeletonBg = cardTheme === "light" ? "bg-stone-200" : "bg-card/60 border border-white/8";

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gap}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`aspect-[4/5] animate-pulse rounded-sm ${skeletonBg}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded border border-amber-500/20 bg-amber-500/8 px-6 py-4 text-center">
        <p className={`text-sm ${cardTheme === "light" ? "text-amber-700" : "text-amber-400"}`}>
          Chưa kết nối được API. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <EmptyAuctionState
        cardTheme={cardTheme}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
      />
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gap}`}>
      {auctions.map((auction) => (
        <ArtAuctionCard key={auction.id} auction={auction} cardTheme={cardTheme} />
      ))}
    </div>
  );
}

type EmptyAuctionStateProps = {
  cardTheme: "dark" | "light";
  hasActiveFilters: boolean;
  onResetFilters?: () => void;
};

function EmptyAuctionState({
  cardTheme,
  hasActiveFilters,
  onResetFilters,
}: EmptyAuctionStateProps) {
  const isLight = cardTheme === "light";

  return (
    <section
      className={cn(
        "relative isolate min-h-[520px] overflow-hidden rounded-md border px-5 py-8 sm:px-8 lg:px-10",
        isLight
          ? "border-[#d8c9ae] bg-[#efe4d3] text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
          : "border-white/10 bg-card/75 text-foreground",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-20",
          isLight ? "bg-[#F6F0E6]" : "bg-[#171717]",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-70",
          isLight
            ? "bg-[linear-gradient(110deg,rgba(47,74,98,0.08)_0_1px,transparent_1px_80px),linear-gradient(0deg,rgba(181,83,62,0.06)_0_1px,transparent_1px_28px)]"
            : "bg-[linear-gradient(110deg,rgba(214,168,79,0.08)_0_1px,transparent_1px_80px),linear-gradient(0deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_28px)]",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute left-0 top-0 h-full w-2/3 -z-10",
          isLight
            ? "bg-[linear-gradient(90deg,rgba(214,168,79,0.2),rgba(214,168,79,0.08)_46%,transparent)]"
            : "bg-[linear-gradient(90deg,rgba(214,168,79,0.12),rgba(214,168,79,0.04)_46%,transparent)]",
        )}
      />

      <div className="flex min-h-[456px] items-center py-6">
        <div className="max-w-2xl">
          <div
            className={cn(
              "mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]",
              isLight
                ? "border-[#d6a84f]/45 bg-white/45 text-[#2E4A62]"
                : "border-primary/35 bg-primary/10 text-primary",
            )}
          >
            <SearchX className="h-3.5 w-3.5" />
            Không tìm thấy lô phù hợp
          </div>

          <h2
            className={cn(
              "max-w-xl font-serif text-3xl font-bold leading-tight sm:text-4xl",
              isLight ? "text-[#171717]" : "text-white",
            )}
          >
            Chưa có phiên đấu giá phù hợp với lựa chọn hiện tại.
          </h2>

          <p
            className={cn(
              "mt-4 max-w-xl text-sm leading-7",
              isLight ? "text-[#6f675b]" : "text-muted-foreground",
            )}
          >
            Các lô gỗ đã kiểm định vẫn đang được cập nhật. Bạn có thể mở rộng bộ lọc hoặc quay về
            toàn bộ phiên để xem những sản phẩm đang sẵn sàng tham gia.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {[
              { icon: <BadgeCheck className="h-3.5 w-3.5" />, label: "Đã kiểm định WoodCert" },
              { icon: <Gavel className="h-3.5 w-3.5" />, label: "Phiên mở liên tục" },
              { icon: <TreePine className="h-3.5 w-3.5" />, label: "Gỗ quý chọn lọc" },
            ].map((item) => (
              <span
                key={item.label}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                  isLight
                    ? "border-[#dfd0b7] bg-white/50 text-[#4c463d]"
                    : "border-white/10 bg-white/5 text-white/80",
                )}
              >
                {item.icon}
                {item.label}
              </span>
            ))}
          </div>

          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className={cn(
                "mt-8 inline-flex items-center gap-2 rounded-sm px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] transition-all",
                isLight
                  ? "bg-[#171717] text-[#D6A84F] hover:bg-[#2b2620] hover:shadow-[0_12px_28px_rgba(23,23,23,0.18)]"
                  : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20",
              )}
            >
              <RotateCcw className="h-4 w-4" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
