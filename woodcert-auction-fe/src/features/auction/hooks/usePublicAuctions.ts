import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getPublicAuctions } from "../api/auctions";
import type { ArtAuction, AuctionFilters, AuctionStatus } from "../types";

const EMPTY_AUCTIONS: ArtAuction[] = [];

export function usePublicAuctions(filters: AuctionFilters = {}, page = 1, size = 9) {
  const { status, categoryName, woodType, materials, priceMin, priceMax } = filters;

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
        status: status as AuctionStatus | undefined,
        material: materialParam,
        categoryName,
        priceMin,
        priceMax,
      }),
  });

  const allAuctions = auctionsQuery.data?.result ?? EMPTY_AUCTIONS;
  const paginationMeta = auctionsQuery.data?.meta ?? null;

  const availableCategories = useMemo(
    () => [...new Set(allAuctions.map((a) => a.categoryName))].sort(),
    [allAuctions],
  );

  const availableWoodTypes = useMemo(
    () => [...new Set(allAuctions.map((a) => a.woodType))].sort(),
    [allAuctions],
  );

  const visibleAuctions = useMemo(() => {
    let result = allAuctions;

    if (categoryName && !materialParam) {
      result = result.filter((a) => a.categoryName.toLowerCase() === categoryName.toLowerCase());
    }

    if (woodType && !materialParam) {
      result = result.filter((a) => a.woodType.toLowerCase() === woodType.toLowerCase());
    }

    return result;
  }, [allAuctions, categoryName, woodType, materialParam]);

  return {
    auctionsQuery,
    allAuctions,
    visibleAuctions,
    availableCategories,
    availableWoodTypes,
    paginationMeta,
  };
}
