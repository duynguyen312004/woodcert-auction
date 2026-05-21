/**
 * Trang danh sách đấu giá public.
 *
 * Trang này gom tab trạng thái, bộ lọc bên trái, phân trang và hook lấy dữ liệu.
 * Đây là luồng chính để người mua duyệt phiên trước khi mở trang chi tiết.
 */
import { useMemo, useState } from "react";

import { useCategories } from "@/features/catalog/hooks/useCategories";
import { cn } from "@/shared/lib/utils";

import { AuctionListContent } from "../components/AuctionListContent";
import {
  AuctionSidebarFilter,
  defaultSidebarFilters,
  type SidebarFilters,
} from "../components/AuctionSidebarFilter";
import { usePublicAuctions } from "../hooks/usePublicAuctions";
import {
  AUCTION_STATUS_TABS,
  auctionTabToStatus,
  type AuctionStatusTab,
} from "../constants/auctionStatus";

const PAGE_SIZE = 9;

export function AuctionListPage() {
  const [activeTab, setActiveTab] = useState<AuctionStatusTab>("ALL");
  const [page, setPage] = useState(1);
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilters>(defaultSidebarFilters);

  const statusFilter = auctionTabToStatus(activeTab);

  const { auctionsQuery, allAuctions, availableWoodTypes, paginationMeta } = usePublicAuctions(
    {
      status: statusFilter,
      materials: sidebarFilters.selectedWoodTypes,
      categoryName: sidebarFilters.selectedCategories[0],
      priceMin: sidebarFilters.appliedPriceMin,
      priceMax: sidebarFilters.appliedPriceMax,
    },
    page,
    PAGE_SIZE,
  );

  const categoriesQuery = useCategories();
  const categoryNames = useMemo(
    () => (categoriesQuery.data ?? []).map((c) => c.name),
    [categoriesQuery.data],
  );

  const displayAuctions = allAuctions;

  const totalPages = paginationMeta?.pages ?? 1;

  const handleTabChange = (tab: AuctionStatusTab) => {
    setActiveTab(tab);
    setPage(1);
    setSidebarFilters(defaultSidebarFilters);
  };

  const handleSidebarChange = (next: SidebarFilters) => {
    setSidebarFilters(next);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10">
        {/* Tiêu đề trang */}
        <div className="mb-10">
          <h1 className="mb-3 font-serif text-3xl font-bold text-foreground lg:text-4xl">
            Phiên đấu giá đang diễn ra
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Khám phá bộ sưu tập gỗ quý hiếm được chứng thực bởi WoodCert, từ những bức tượng tinh
            xảo đến nội thất nghệ thuật độc bản.
          </p>

          {/* Tab trạng thái */}
          <div className="mt-8 flex gap-8 overflow-x-auto border-b border-white/10 pb-px">
            {AUCTION_STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "shrink-0 pb-4 text-sm font-bold uppercase tracking-widest transition-colors",
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-white"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout chính: sidebar và khu vực card */}
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar bên trái */}
          <AuctionSidebarFilter
            availableCategories={categoryNames}
            isCategoriesLoading={categoriesQuery.isLoading}
            availableWoodTypes={availableWoodTypes}
            isWoodTypesLoading={auctionsQuery.isLoading && availableWoodTypes.length === 0}
            filters={sidebarFilters}
            onChange={handleSidebarChange}
          />

          {/* Khu vực card, dùng nền sáng cho trang danh sách */}
          <div className="min-w-0 flex-1 rounded-lg bg-[#F6F0E6] p-6 lg:p-8">
            <AuctionListContent
              auctions={displayAuctions}
              isLoading={auctionsQuery.isLoading}
              isError={auctionsQuery.isError}
              cardTheme="light"
            />

            {/* Phân trang */}
            {!auctionsQuery.isLoading && (
              <div className="mt-14 flex flex-col items-center gap-6">
                {page < totalPages && (
                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    className="border border-[#D6A84F]/30 bg-[#0F0F0D] px-12 py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#D6A84F] transition-colors hover:bg-stone-900"
                  >
                    Tải thêm tác phẩm
                  </button>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center gap-3 font-bold text-sm text-stone-400">
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="transition-colors hover:text-[#0F0F0D] disabled:opacity-30"
                    >
                      ‹
                    </button>

                    {buildPageNumbers(page, totalPages).map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="select-none">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p as number)}
                          className={cn(
                            "min-w-[28px] text-center transition-colors hover:text-[#0F0F0D]",
                            page === p ? "font-bold text-[#0F0F0D]" : "",
                          )}
                        >
                          {p}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                      className="transition-colors hover:text-[#0F0F0D] disabled:opacity-30"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  // Giữ phân trang gọn nhưng vẫn có trang đầu, trang gần hiện tại và trang cuối.
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }

  if (current < total - 2) pages.push("...");
  pages.push(total);

  return pages;
}
