import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

import type { OrderDetail, OrderSummary } from "../types";

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
  payRemainder: async (orderId: number): Promise<OrderDetail> => {
    const response = await apiClient.post<ApiResponse<OrderDetail>>(`/orders/${orderId}/pay`);
    return mapOrder(unwrapApiResponse(response));
  },

  getDetail: async (orderId: number): Promise<OrderDetail> => {
    const response = await apiClient.get<ApiResponse<OrderDetail>>(`/orders/${orderId}`);
    return mapOrder(unwrapApiResponse(response));
  },
};
