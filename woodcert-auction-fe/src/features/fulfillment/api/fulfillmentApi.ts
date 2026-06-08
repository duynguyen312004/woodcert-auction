import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";
import { mapOrder } from "@/features/order/api/orderApi";
import type { ConfirmShippingPayload, OrderDetail } from "@/features/order/types";

export const fulfillmentApi = {
  confirmShipping: async (
    orderId: number,
    payload: ConfirmShippingPayload,
  ): Promise<OrderDetail> => {
    const response = await apiClient.patch<ApiResponse<OrderDetail>>(
      `/orders/${orderId}/fulfillment/ship`,
      {
        deliveryMethod: payload.deliveryMethod,
        carrierName: payload.carrierName || null,
        trackingCode: payload.trackingCode || null,
      },
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
