import {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it } from "vitest";

import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { orderApi } from "./orderApi";

function createResponse<T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T,
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status >= 400 ? "Error" : "OK",
    headers: new AxiosHeaders(),
    config,
  };
}

function createApiResponse<T>(data: T, statusCode = 200): ApiResponse<T> {
  return {
    statusCode,
    message: statusCode >= 400 ? "Error" : "OK",
    data,
    timestamp: "2026-06-02T00:00:00Z",
  };
}

function paginated<T>(result: T[]): PaginationResponse<T> {
  return {
    meta: {
      page: 1,
      pageSize: result.length,
      pages: 1,
      total: result.length,
    },
    result,
  };
}

describe("orderApi", () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("fetches buyer orders and maps money strings to numbers", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/orders/my-purchases");
      expect(config.params).toEqual({ page: 1, size: 10 });

      return createResponse(
        config,
        200,
        createApiResponse(
          paginated([
            {
              id: 91,
              sourceType: "AUCTION",
              sourceId: 501,
              productId: 801,
              buyerId: "buyer-1",
              sellerId: "seller-1",
              status: "DISPUTED",
              finalPrice: "10000000",
              depositAmount: "1000000",
              remainingAmount: "9000000",
              platformCommissionRate: null,
              platformCommissionAmount: null,
              sellerPayoutAmount: null,
              forfeitedDepositPlatformFeeAmount: null,
              forfeitedDepositSellerAmount: null,
              paymentDeadline: null,
              paidAt: "2026-06-02T01:00:00Z",
              completedAt: null,
              canceledAt: null,
              cancelReason: null,
              fulfillment: { id: 17, status: "SHIPPED" },
              createdAt: "2026-06-02T00:00:00Z",
              updatedAt: "2026-06-02T00:00:00Z",
            },
          ]),
        ),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(orderApi.getMyPurchases({ page: 1, size: 10 })).resolves.toMatchObject({
      result: [
        {
          id: 91,
          finalPrice: 10000000,
          depositAmount: 1000000,
          remainingAmount: 9000000,
          status: "DISPUTED",
        },
      ],
    });
  });

  it("posts buyer payment to the order pay endpoint", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/orders/91/pay");

      return createResponse(
        config,
        200,
        createApiResponse({
          id: 91,
          sourceType: "AUCTION",
          sourceId: 501,
          productId: 801,
          buyerId: "buyer-1",
          sellerId: "seller-1",
          status: "PAID",
          finalPrice: "10000000",
          depositAmount: "1000000",
          remainingAmount: "9000000",
          platformCommissionRate: null,
          platformCommissionAmount: null,
          sellerPayoutAmount: null,
          forfeitedDepositPlatformFeeAmount: null,
          forfeitedDepositSellerAmount: null,
          paymentDeadline: null,
          paidAt: "2026-06-02T01:00:00Z",
          completedAt: null,
          canceledAt: null,
          cancelReason: null,
          fulfillment: null,
          createdAt: "2026-06-02T00:00:00Z",
          updatedAt: "2026-06-02T01:00:00Z",
        }),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(orderApi.payRemainder(91)).resolves.toMatchObject({
      id: 91,
      status: "PAID",
      finalPrice: 10000000,
    });
  });
});
