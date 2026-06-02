import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";
import { mapOrder } from "@/features/order";
import type { OrderDetail } from "@/features/order";

export const fulfillmentApi = {
  confirmShipping: async (orderId: number, trackingCode?: string): Promise<OrderDetail> => {
    const response = await apiClient.patch<ApiResponse<OrderDetail>>(
      `/orders/${orderId}/fulfillment/ship`,
      { trackingCode: trackingCode || null },
    );
    return mapOrder(unwrapApiResponse(response));
  },

  confirmReceived: async (orderId: number): Promise<OrderDetail> => {
    const response = await apiClient.patch<ApiResponse<OrderDetail>>(
      `/orders/${orderId}/fulfillment/receive`,
    );
    return mapOrder(unwrapApiResponse(response));
  },
};
