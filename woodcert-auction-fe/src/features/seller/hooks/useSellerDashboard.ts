/**
 * Hook lấy dữ liệu cho dashboard seller.
 *
 * Các hook nhỏ gọi API sản phẩm/phiên đấu giá. useSellerDashboard gom dữ liệu
 * thành KPI, sản phẩm gần đây và phiên đang chạy cho trang dashboard.
 */
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { sellerApi } from "../api/seller";
import type { ProductStatus } from "../types";

const SELLER_AUCTION_REFRESH_INTERVAL_MS = 5_000;

export function useSellerProducts(params?: {
  page?: number;
  size?: number;
  status?: string;
  saleStatus?: string;
}) {
  return useQuery({
    queryKey: ["seller", "products", params] as const,
    queryFn: () => sellerApi.getMyProducts(params),
  });
}

export function useSellerProductDetail(productId: number | undefined) {
  return useQuery({
    queryKey: ["seller", "product", productId] as const,
    queryFn: () => sellerApi.getProductDetail(productId as number),
    enabled: productId !== undefined,
  });
}

export function useSellerAuctions(params?: { page?: number; size?: number; status?: string }) {
  return useQuery({
    queryKey: ["seller", "auctions", params] as const,
    queryFn: () => sellerApi.getMyAuctions(params),
    refetchInterval: SELLER_AUCTION_REFRESH_INTERVAL_MS,
  });
}

/**
 * Lấy thống kê số phiên theo trạng thái từ endpoint chuyên biệt.
 * Chính xác với mọi số lượng phiên, không bị giới hạn bởi page size.
 */
export function useSellerAuctionStats() {
  return useQuery({
    queryKey: ["seller", "auction-stats"] as const,
    queryFn: () => sellerApi.getMyAuctionStats(),
    refetchInterval: SELLER_AUCTION_REFRESH_INTERVAL_MS,
  });
}

export function useSellerAuctionDetail(auctionId: number | undefined) {
  return useQuery({
    queryKey: ["seller", "auction", auctionId] as const,
    queryFn: () => sellerApi.getMyAuctionDetail(auctionId as number),
    enabled: auctionId !== undefined,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "WAITING" || status === "ACTIVE"
        ? SELLER_AUCTION_REFRESH_INTERVAL_MS
        : false;
    },
  });
}

export function useSellerDashboard() {
  const recentProductsQuery = useSellerProducts({ size: 5 });
  // Dashboard cần nhiều sản phẩm hơn để đếm trạng thái ngay trên giao diện.
  const allProductsQuery = useSellerProducts({ size: 100 });
  const activeAuctionQuery = useSellerAuctions({ status: "ACTIVE", size: 1 });

  const stats = useMemo(() => {
    const all = allProductsQuery.data?.result ?? [];
    const countByStatus = (s: ProductStatus) => all.filter((p) => p.status === s).length;
    return {
      draftCount: countByStatus("DRAFT"),
      pendingAppraisalCount: countByStatus("PENDING_APPRAISAL"),
      appraisedCount: countByStatus("APPRAISED"),
      activeAuctionCount: activeAuctionQuery.data?.meta.total ?? 0,
    };
  }, [allProductsQuery.data, activeAuctionQuery.data]);

  return {
    stats,
    recentProducts: recentProductsQuery.data?.result ?? [],
    activeAuction: activeAuctionQuery.data?.result[0] ?? null,
    isLoading:
      recentProductsQuery.isPending || allProductsQuery.isPending || activeAuctionQuery.isPending,
    isError: recentProductsQuery.isError || allProductsQuery.isError || activeAuctionQuery.isError,
    refetch: () => {
      void recentProductsQuery.refetch();
      void allProductsQuery.refetch();
      void activeAuctionQuery.refetch();
    },
  };
}
