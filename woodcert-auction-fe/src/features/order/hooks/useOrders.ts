import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fulfillmentApi } from "@/features/fulfillment/api/fulfillmentApi";

import { orderApi } from "../api/orderApi";
import type { ConfirmShippingPayload, OrderListParams, SellerSalesRange } from "../types";

const SELLER_OPERATIONAL_REFRESH_MS = 10_000;

export function useBuyerOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: ["orders", "buyer", params] as const,
    queryFn: () => orderApi.getMyPurchases(params),
  });
}

export function useBuyerOrderStatusCounts() {
  return useQuery({
    queryKey: ["orders", "buyer", "status-counts"] as const,
    queryFn: orderApi.getMyPurchaseStatusCounts,
  });
}

export function useSellerOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: ["orders", "seller", params] as const,
    queryFn: () => orderApi.getMySales(params),
    refetchInterval: SELLER_OPERATIONAL_REFRESH_MS,
  });
}

export function useSellerOrderStatusCounts() {
  return useQuery({
    queryKey: ["orders", "seller", "status-counts"] as const,
    queryFn: orderApi.getMySaleStatusCounts,
    refetchInterval: SELLER_OPERATIONAL_REFRESH_MS,
  });
}

export function useSellerSalesSummary(range: SellerSalesRange) {
  return useQuery({
    queryKey: ["orders", "seller", "summary", range] as const,
    queryFn: () => orderApi.getSellerSalesSummary(range),
    refetchInterval: SELLER_OPERATIONAL_REFRESH_MS,
  });
}

export function useOrderDetail(orderId: number | undefined) {
  return useQuery({
    queryKey: ["orders", "detail", orderId] as const,
    queryFn: () => orderApi.getDetail(orderId as number),
    enabled: orderId !== undefined,
  });
}

export function useOrderMutations() {
  const queryClient = useQueryClient();
  const invalidateOrders = () => {
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
    void queryClient.invalidateQueries({ queryKey: ["buyer"] });
    void queryClient.invalidateQueries({ queryKey: ["seller"] });
  };

  return {
    payRemainder: useMutation({
      mutationFn: orderApi.payRemainder,
      onSuccess: () => {
        invalidateOrders();
        void queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
      },
    }),
    confirmReceived: useMutation({
      mutationFn: fulfillmentApi.confirmReceived,
      onSuccess: invalidateOrders,
    }),
    confirmShipping: useMutation({
      mutationFn: ({ orderId, payload }: { orderId: number; payload: ConfirmShippingPayload }) =>
        fulfillmentApi.confirmShipping(orderId, payload),
      onSuccess: (order) => {
        invalidateOrders();
        queryClient.setQueryData(["orders", "detail", order.id], order);
        void queryClient.invalidateQueries({ queryKey: ["orders", "seller", "summary"] });
        void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard"] });
      },
    }),
  };
}
