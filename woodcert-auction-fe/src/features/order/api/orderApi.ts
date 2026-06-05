import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

import type { OrderDetail, OrderListParams, OrderStatusCounts, OrderSummary } from "../types";

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function mapOrder<T extends OrderSummary | OrderDetail | null>(order: T): T {
  if (!order) return order;
  return {
    ...order,
    finalPrice: toNumber(order.finalPrice),
    depositAmount: toNumber(order.depositAmount),
    remainingAmount: toNumber(order.remainingAmount),
    platformCommissionRate:
      order.platformCommissionRate == null ? null : toNumber(order.platformCommissionRate),
    platformCommissionAmount:
      order.platformCommissionAmount == null ? null : toNumber(order.platformCommissionAmount),
    sellerPayoutAmount:
      order.sellerPayoutAmount == null ? null : toNumber(order.sellerPayoutAmount),
    forfeitedDepositPlatformFeeAmount:
      order.forfeitedDepositPlatformFeeAmount == null
        ? null
        : toNumber(order.forfeitedDepositPlatformFeeAmount),
    forfeitedDepositSellerAmount:
      order.forfeitedDepositSellerAmount == null
        ? null
        : toNumber(order.forfeitedDepositSellerAmount),
  } as T;
}

export const orderApi = {
  getMyPurchases: async (params?: OrderListParams): Promise<PaginationResponse<OrderSummary>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<OrderSummary>>>(
      "/orders/my-purchases",
      { params },
    );
    const data = unwrapApiResponse(response);
    return { ...data, result: data.result.map((order) => mapOrder(order)) };
  },

  getMySales: async (params?: OrderListParams): Promise<PaginationResponse<OrderSummary>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<OrderSummary>>>(
      "/orders/my-sales",
      { params },
    );
    const data = unwrapApiResponse(response);
    return { ...data, result: data.result.map((order) => mapOrder(order)) };
  },

  getMyPurchaseStatusCounts: async (): Promise<OrderStatusCounts> => {
    const response = await apiClient.get<ApiResponse<OrderStatusCounts>>(
      "/orders/my-purchases/status-counts",
    );
    return unwrapApiResponse(response);
  },

  getMySaleStatusCounts: async (): Promise<OrderStatusCounts> => {
    const response = await apiClient.get<ApiResponse<OrderStatusCounts>>(
      "/orders/my-sales/status-counts",
    );
    return unwrapApiResponse(response);
  },

  payRemainder: async (orderId: number): Promise<OrderDetail> => {
    const response = await apiClient.post<ApiResponse<OrderDetail>>(`/orders/${orderId}/pay`);
    return mapOrder(unwrapApiResponse(response));
  },

  getDetail: async (orderId: number): Promise<OrderDetail> => {
    const response = await apiClient.get<ApiResponse<OrderDetail>>(`/orders/${orderId}`);
    return mapOrder(unwrapApiResponse(response));
  },
};
