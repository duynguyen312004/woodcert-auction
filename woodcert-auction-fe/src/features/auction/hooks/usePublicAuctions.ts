/**
 * Hook lấy danh sách đấu giá public.
 *
 * Hook này đổi filter trên UI thành query param cho backend, lấy dữ liệu phân
 * trang và tạo thêm danh sách option cho bộ lọc.
 */
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useCategories } from "@/features/catalog";
import { getPublicAuctions } from "../api/auctions";
import { usePublicAuctionMaterials } from "./usePublicAuctionMaterials";
import type { ArtAuction, AuctionFilters } from "../types";

const EMPTY_AUCTIONS: ArtAuction[] = [];

export function usePublicAuctions(filters: AuctionFilters = {}, page = 1, size = 9) {
  const { status, categoryName, materials, priceMin, priceMax } = filters;

  // Backend nhận nhiều chất liệu bằng một chuỗi, ngăn cách bởi dấu phẩy.
  const materialParam = materials && materials.length > 0 ? materials.join(",") : undefined;

  const auctionsQuery = useQuery({
    queryKey: [
      "auctions",
      "list",
      { page, size, status, materialParam, categoryName, priceMin, priceMax },
    ] as const,
    queryFn: () =>
      getPublicAuctions({
        page,
        size,
        status,
        material: materialParam,
        categoryName,
        priceMin,
        priceMax,
      }),
  });

  const allAuctions = auctionsQuery.data?.result ?? EMPTY_AUCTIONS;
  const paginationMeta = auctionsQuery.data?.meta ?? null;

  const { data: categoriesData } = useCategories();
  const availableCategories = useMemo(() => {
    if (!categoriesData) return [];
    return categoriesData.map((c) => c.name).sort();
  }, [categoriesData]);

  const materialsQuery = usePublicAuctionMaterials();
  const availableWoodTypes = useMemo(() => materialsQuery.data ?? [], [materialsQuery.data]);

  return {
    auctionsQuery,
    allAuctions,
    availableCategories,
    availableWoodTypes,
    isWoodTypesLoading: materialsQuery.isLoading,
    paginationMeta,
  };
}
