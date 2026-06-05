import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fulfillmentApi } from "@/features/fulfillment/api/fulfillmentApi";

import { orderApi } from "../api/orderApi";
import type { OrderListParams } from "../types";

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
  });
}

export function useSellerOrderStatusCounts() {
  return useQuery({
    queryKey: ["orders", "seller", "status-counts"] as const,
    queryFn: orderApi.getMySaleStatusCounts,
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
      onSuccess: invalidateOrders,
    }),
    confirmReceived: useMutation({
      mutationFn: fulfillmentApi.confirmReceived,
      onSuccess: invalidateOrders,
    }),
    confirmShipping: useMutation({
      mutationFn: ({ orderId, trackingCode }: { orderId: number; trackingCode?: string }) =>
        fulfillmentApi.confirmShipping(orderId, trackingCode),
      onSuccess: invalidateOrders,
    }),
  };
}
