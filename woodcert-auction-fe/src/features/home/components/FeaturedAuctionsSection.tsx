import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { ArtAuctionCard, usePublicAuctions } from "@/features/auction";

export function FeaturedAuctionsSection() {
  const { auctionsQuery, allAuctions } = usePublicAuctions({});

  // Sắp xếp theo lượt bid giảm dần và lấy ra 4 sản phẩm có nhiều người bid nhất
  const displayAuctions = [...allAuctions].sort((a, b) => b.bidCount - a.bidCount).slice(0, 4);

  return (
    <section
      id="featured-auctions"
      className="py-24 relative overflow-hidden bg-background select-none"
    >
      {/* Decorative Golden Ambient Glow */}
      <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-primary/3 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Tiêu đề gọn gàng, bỏ nút góc phải */}
        <div className="mb-14 text-center sm:text-left">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Premium Spotlight
          </span>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-[2.75rem] leading-tight">
            Đấu giá tiêu biểu
          </h2>
        </div>

        {/* Trạng thái Loading */}
        {auctionsQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-lg bg-card/60 border border-white/8"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : auctionsQuery.isError ? (
          <div className="rounded border border-amber-500/20 bg-amber-500/8 px-6 py-4 text-center">
            <p className="text-sm text-amber-400">Chưa kết nối được API. Vui lòng thử lại sau.</p>
          </div>
        ) : displayAuctions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#121210]/40 p-8 text-center text-sm text-muted-foreground backdrop-blur-sm">
            Chưa có phiên đấu giá nào đang diễn ra.
          </div>
        ) : (
          /* Grid 4 cột cân đối cho 4 sản phẩm */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayAuctions.map((auction) => (
              <ArtAuctionCard key={auction.id} auction={auction} cardTheme="dark" />
            ))}
          </div>
        )}

        {/* Nút Xem tất cả ở dưới cùng */}
        <div className="mt-16 flex justify-center">
          <Link
            to="/auctions"
            className="group relative overflow-hidden inline-flex items-center gap-2.5 rounded border border-primary/40 bg-primary/5 px-10 py-3.5 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            Xem tất cả tác phẩm
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
