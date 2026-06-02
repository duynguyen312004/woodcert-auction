/**
 * Mutation hooks cho workflow tạo sản phẩm và gửi thẩm định của seller.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sellerApi } from "../api/seller";
import type { UpdateProductPayload } from "../types";

const SELLER_PRODUCTS_QUERY_KEY = ["seller", "products"] as const;
const SELLER_AUCTIONS_QUERY_KEY = ["seller", "auctions"] as const;
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
    },
  });
}

export function useCancelAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (auctionId: number) => sellerApi.cancelAuction(auctionId),
    onSuccess: (_result, auctionId) => {
      void queryClient.invalidateQueries({ queryKey: SELLER_PRODUCTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SELLER_AUCTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["seller", "auction", auctionId] });
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
