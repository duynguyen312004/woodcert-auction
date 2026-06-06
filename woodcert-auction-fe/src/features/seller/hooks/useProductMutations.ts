/**
 * Mutation hooks cho workflow tạo sản phẩm và gửi thẩm định của seller.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PaginationResponse } from "@/shared/api/types";

import { sellerApi } from "../api/seller";
import type {
  SellerAuction,
  SellerAuctionDetail,
  SellerAuctionStats,
  UpdateProductPayload,
} from "../types";

const SELLER_PRODUCTS_QUERY_KEY = ["seller", "products"] as const;
const SELLER_AUCTIONS_QUERY_KEY = ["seller", "auctions"] as const;
const SELLER_AUCTION_STATS_QUERY_KEY = ["seller", "auction-stats"] as const;
const SELLER_PRODUCT_DETAIL_QUERY_KEY = ["seller", "product"] as const;

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sellerApi.createProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: UpdateProductPayload }) =>
      sellerApi.updateProduct(productId, payload),
    onSuccess: (_product, variables) => {
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...SELLER_PRODUCT_DETAIL_QUERY_KEY, variables.productId],
      });
    },
  });
}

export function useSubmitAppraisal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => sellerApi.submitAppraisal(productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
    },
  });
}

export function useCreateAuctionSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sellerApi.createAuctionSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SELLER_AUCTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SELLER_AUCTION_STATS_QUERY_KEY });
    },
  });
}

export function useCancelAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (auctionId: number) => sellerApi.cancelAuction(auctionId),
    onSuccess: (_result, auctionId) => {
      queryClient
        .getQueriesData<PaginationResponse<SellerAuction>>({
          queryKey: SELLER_AUCTIONS_QUERY_KEY,
        })
        .forEach(([queryKey, current]) => {
          if (!current) return;
          const params = queryKey[2] as { status?: string } | undefined;
          const targetExists = current.result.some((auction) => Number(auction.id) === auctionId);
          if (!targetExists) return;

          if (params?.status === "WAITING") {
            queryClient.setQueryData<PaginationResponse<SellerAuction>>(queryKey, {
              ...current,
              result: current.result.filter((auction) => Number(auction.id) !== auctionId),
              meta: {
                ...current.meta,
                total: Math.max(0, current.meta.total - 1),
              },
            });
            return;
          }

          queryClient.setQueryData<PaginationResponse<SellerAuction>>(queryKey, {
            ...current,
            result: current.result.map((auction) =>
              Number(auction.id) === auctionId ? { ...auction, status: "CANCELED" } : auction,
            ),
          });
        });
      queryClient.setQueryData<SellerAuctionDetail>(["seller", "auction", auctionId], (current) =>
        current ? { ...current, status: "CANCELED" } : current,
      );
      queryClient.setQueryData<SellerAuctionStats>(SELLER_AUCTION_STATS_QUERY_KEY, (current) =>
        current
          ? {
              ...current,
              waiting: Math.max(0, current.waiting - 1),
              canceled: current.canceled + 1,
            }
          : current,
      );

      return Promise.all([
        queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: SELLER_AUCTIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: SELLER_AUCTION_STATS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["seller", "auction", auctionId] }),
      ]);
    },
  });
}

export function useConfirmShipping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, trackingCode }: { orderId: number; trackingCode?: string }) =>
      sellerApi.confirmShipping(orderId, trackingCode),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ["seller", "auction", order.sourceId] });
      void queryClient.invalidateQueries({ queryKey: SELLER_AUCTIONS_QUERY_KEY });
    },
  });
}
