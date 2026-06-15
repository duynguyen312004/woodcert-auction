import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

import { useSellerOrders, useSellerSalesSummary } from "@/features/order";

import { sellerApi } from "../api/seller";

const SELLER_OPERATIONAL_REFRESH_MS = 10_000;

export function useSellerProducts(params?: {
  page?: number;
  size?: number;
  status?: string;
  saleStatus?: string;
}) {
  return useQuery({
    queryKey: ["seller", "products", params] as const,
    queryFn: () => sellerApi.getMyProducts(params),
    refetchInterval: SELLER_OPERATIONAL_REFRESH_MS,
  });
}

export function useSellerProductStats() {
  return useQuery({
    queryKey: ["seller", "product-stats"] as const,
    queryFn: sellerApi.getMyProductStats,
    refetchInterval: SELLER_OPERATIONAL_REFRESH_MS,
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
    refetchInterval: SELLER_OPERATIONAL_REFRESH_MS,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useSellerAuctionStats() {
  return useQuery({
    queryKey: ["seller", "auction-stats"] as const,
    queryFn: sellerApi.getMyAuctionStats,
    refetchInterval: SELLER_OPERATIONAL_REFRESH_MS,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useSellerAuctionDetail(auctionId: number | undefined) {
  return useQuery({
    queryKey: ["seller", "auction", auctionId] as const,
    queryFn: () => sellerApi.getMyAuctionDetail(auctionId as number),
    enabled: auctionId !== undefined,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "WAITING" || status === "ACTIVE" ? SELLER_OPERATIONAL_REFRESH_MS : false;
    },
  });
}

export function useSellerDashboard() {
  const recentProductsQuery = useSellerProducts({ size: 5 });
  const productStatsQuery = useSellerProductStats();
  const activeAuctionQuery = useSellerAuctions({ status: "ACTIVE", size: 1 });
  const auctionStatsQuery = useSellerAuctionStats();
  const waitingAuctionQuery = useSellerAuctions({ status: "WAITING", size: 3 });
  const paidOrdersQuery = useSellerOrders({ status: "PAID", size: 3 });
  const disputedOrdersQuery = useSellerOrders({ status: "DISPUTED", size: 3 });
  const salesSummaryQuery = useSellerSalesSummary("30D");
  const retriedMissingActiveAuction = useRef(false);

  const {
    data: activeAuctionData,
    isFetching: isActiveAuctionFetching,
    refetch: refetchActiveAuction,
  } = activeAuctionQuery;
  const activeAuction = activeAuctionData?.result[0] ?? null;
  const activeAuctionCount = auctionStatsQuery.data?.active ?? activeAuctionData?.meta.total ?? 0;

  useEffect(() => {
    const activeAuctionMissing = activeAuctionCount > 0 && activeAuction === null;
    if (!activeAuctionMissing) {
      retriedMissingActiveAuction.current = false;
      return;
    }
    if (retriedMissingActiveAuction.current || isActiveAuctionFetching) {
      return;
    }

    retriedMissingActiveAuction.current = true;
    void refetchActiveAuction();
  }, [activeAuction, activeAuctionCount, isActiveAuctionFetching, refetchActiveAuction]);

  const stats = useMemo(
    () => ({
      draftCount: productStatsQuery.data?.byStatus.DRAFT ?? 0,
      pendingAppraisalCount: productStatsQuery.data?.byStatus.PENDING_APPRAISAL ?? 0,
      auctionReadyCount: productStatsQuery.data?.auctionReadyCount ?? 0,
      activeAuctionCount,
      pendingShipmentCount: paidOrdersQuery.data?.meta.total ?? 0,
      disputedOrderCount: disputedOrdersQuery.data?.meta.total ?? 0,
    }),
    [productStatsQuery.data, activeAuctionCount, paidOrdersQuery.data, disputedOrdersQuery.data],
  );

  return {
    stats,
    recentProducts: recentProductsQuery.data?.result ?? [],
    activeAuction,
    waitingAuctionCount: waitingAuctionQuery.data?.meta.total ?? 0,
    realizedIncome30D: salesSummaryQuery.data?.totalRealizedIncome ?? 0,
    isLoading:
      recentProductsQuery.isPending ||
      productStatsQuery.isPending ||
      activeAuctionQuery.isPending ||
      waitingAuctionQuery.isPending ||
      paidOrdersQuery.isPending ||
      disputedOrdersQuery.isPending ||
      salesSummaryQuery.isPending,
    isError:
      recentProductsQuery.isError ||
      productStatsQuery.isError ||
      activeAuctionQuery.isError ||
      waitingAuctionQuery.isError ||
      paidOrdersQuery.isError ||
      disputedOrdersQuery.isError ||
      salesSummaryQuery.isError,
    refetch: () => {
      void recentProductsQuery.refetch();
      void productStatsQuery.refetch();
      void refetchActiveAuction();
      void auctionStatsQuery.refetch();
      void waitingAuctionQuery.refetch();
      void paidOrdersQuery.refetch();
      void disputedOrdersQuery.refetch();
      void salesSummaryQuery.refetch();
    },
  };
}
