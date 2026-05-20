import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import {
  AuctionFilterBar,
  AuctionListContent,
  usePublicAuctions,
  type AuctionFilters,
} from "@/features/auction";

export function FeaturedAuctionsSection() {
  const [filters, setFilters] = useState<AuctionFilters>({});
  const { auctionsQuery, visibleAuctions, availableCategories, availableWoodTypes } =
    usePublicAuctions(filters);

  return (
    <section id="featured-auctions" className="py-20">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <span className="mb-2 block text-sm font-bold uppercase tracking-widest text-primary">
              Premium Selection
            </span>
            <h2 className="font-serif text-4xl font-bold text-foreground md:text-[2.75rem]">
              Đấu giá đang diễn ra
            </h2>
          </div>
          <Link
            to="/auctions"
            className="group hidden items-center gap-2 text-sm font-bold text-primary transition-all hover:gap-3 md:inline-flex"
          >
            Xem tất cả{" "}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mb-8">
          <AuctionFilterBar
            filters={filters}
            onChange={setFilters}
            availableCategories={availableCategories}
            availableWoodTypes={availableWoodTypes}
            isLoading={auctionsQuery.isLoading}
          />
        </div>

        <AuctionListContent
          auctions={visibleAuctions}
          isLoading={auctionsQuery.isLoading}
          isError={auctionsQuery.isError}
        />

        <div className="mt-14 flex justify-center">
          <Link
            to="/auctions"
            className="group inline-flex items-center gap-2.5 rounded-full border border-primary/40 px-10 py-3.5 text-sm font-semibold text-primary transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
          >
            Xem tất cả tác phẩm
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
