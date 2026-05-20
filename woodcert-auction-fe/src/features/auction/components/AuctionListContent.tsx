import type { ArtAuction } from "../types";
import { ArtAuctionCard } from "./ArtAuctionCard";

type AuctionListContentProps = {
  auctions: ArtAuction[];
  isLoading: boolean;
  isError: boolean;
  cardTheme?: "dark" | "light";
};

export function AuctionListContent({
  auctions,
  isLoading,
  isError,
  cardTheme = "dark",
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
      <div className="rounded border border-stone-200 bg-stone-50 px-6 py-4 text-center">
        <p
          className={`text-sm ${cardTheme === "light" ? "text-stone-500" : "text-muted-foreground"}`}
        >
          Chưa có phiên đấu giá phù hợp.
        </p>
      </div>
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
