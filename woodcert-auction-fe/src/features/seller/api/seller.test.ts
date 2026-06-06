import {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it } from "vitest";

import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { sellerApi } from "./seller";

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
    timestamp: "2026-05-21T00:00:00Z",
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

describe("sellerApi", () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("maps seller product DTO fields to dashboard product model", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/products");
      expect(config.params).toEqual({ size: 5 });

      return createResponse(
        config,
        200,
        createApiResponse(
          paginated([
            {
              id: 101,
              title: "Bàn gỗ lim",
              category: { id: 1, name: "Nội thất" },
              material: "Gỗ lim",
              status: "APPRAISED",
              saleStatus: "AVAILABLE",
              primaryImage: "https://cdn.example/product.jpg",
              createdAt: "2026-05-20T10:00:00Z",
            },
          ]),
        ),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(sellerApi.getMyProducts({ size: 5 })).resolves.toMatchObject({
      result: [
        {
          id: "101",
          title: "Bàn gỗ lim",
          woodType: "Gỗ lim",
          imageUrl: "https://cdn.example/product.jpg",
          status: "APPRAISED",
          saleStatus: "AVAILABLE",
        },
      ],
    });
  });

  it("maps seller auction DTO fields and forwards status filter", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/auctions/me");
      expect(config.params).toEqual({ status: "ACTIVE", size: 1 });

      return createResponse(
        config,
        200,
        createApiResponse(
          paginated([
            {
              id: 501,
              productTitle: "Tượng gỗ trắc",
              productId: 101,
              status: "ACTIVE",
              startingPrice: "1000000",
              depositAmount: "100000",
              startTime: "2026-05-21T10:00:00Z",
              endTime: "2026-05-21T11:00:00Z",
              currentPrice: "1300000",
              participantCount: 7,
              createdAt: "2026-05-20T10:00:00Z",
            },
          ]),
        ),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(sellerApi.getMyAuctions({ status: "ACTIVE", size: 1 })).resolves.toMatchObject({
      result: [
        {
          id: "501",
          title: "Tượng gỗ trắc",
          currentPrice: 1300000,
          productId: "101",
          startingPrice: 1000000,
          depositAmount: 100000,
          bidCount: 7,
          imageUrl: null,
        },
      ],
    });
  });

  it("fetches product detail with media ids for draft editing", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/products/101");

      return createResponse(
        config,
        200,
        createApiResponse({
          id: 101,
          title: "Tượng gỗ",
          description: "Bản nháp",
          material: "Gỗ hương",
          dimensions: "30x20x10",
          weight: "2.5",
          status: "DRAFT",
          saleStatus: "AVAILABLE",
          category: { id: 1, name: "Tượng", slug: "tuong", parentId: null, description: null },
          images: [
            {
              id: 11,
              mediaId: 501,
              imageUrl: "https://cdn.example/product.jpg",
              isPrimary: true,
              sortOrder: 0,
            },
          ],
          createdAt: "2026-05-20T10:00:00Z",
        }),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(sellerApi.getProductDetail(101)).resolves.toMatchObject({
      id: 101,
      status: "DRAFT",
      images: [{ mediaId: 501, imageUrl: "https://cdn.example/product.jpg" }],
    });
  });

  it("updates product draft with PUT payload", async () => {
    const payload = {
      categoryId: 1,
      title: "Tượng gỗ cập nhật",
      material: "Gỗ hương",
      images: [{ mediaId: 501, isPrimary: true, sortOrder: 0 }],
    };

    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("put");
      expect(config.url).toBe("/products/101");
      expect(JSON.parse(config.data as string)).toEqual(payload);

      return createResponse(
        config,
        200,
        createApiResponse({
          id: 101,
          title: payload.title,
          description: null,
          material: payload.material,
          dimensions: null,
          weight: null,
          status: "DRAFT",
          saleStatus: "AVAILABLE",
          category: { id: 1, name: "Tượng", slug: "tuong", parentId: null, description: null },
          images: [
            {
              id: 11,
              mediaId: 501,
              imageUrl: "https://cdn.example/product.jpg",
              isPrimary: true,
              sortOrder: 0,
            },
          ],
          createdAt: "2026-05-20T10:00:00Z",
        }),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(sellerApi.updateProduct(101, payload)).resolves.toMatchObject({
      id: 101,
      title: payload.title,
    });
  });

  it("creates seller auction session with POST payload", async () => {
    const payload = {
      productId: 101,
      startingPrice: 10000000,
      reservePrice: 12000000,
      stepPrice: 100000,
      depositAmount: 1000000,
      startTime: "2026-05-21T10:00:00.000Z",
      endTime: "2026-05-21T12:00:00.000Z",
    };

    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/auctions");
      expect(JSON.parse(config.data as string)).toEqual(payload);

      return createResponse(config, 201, createApiResponse({ id: 501 }, 201));
    };
    apiClient.defaults.adapter = adapter;

    await expect(sellerApi.createAuctionSession(payload)).resolves.toEqual({ id: 501 });
  });

  it("maps seller auction detail with settlement summary", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/auctions/me/501");

      return createResponse(
        config,
        200,
        createApiResponse({
          id: 501,
          status: "ENDED_SUCCESS",
          startingPrice: "10000000",
          reservePrice: "12000000",
          stepPrice: "100000",
          depositAmount: "1000000",
          currentPrice: "15000000",
          finalPrice: "15000000",
          startTime: "2026-05-25T11:00:00Z",
          endTime: "2026-05-25T13:00:00Z",
          participantCount: 3,
          winnerMaskedAlias: "winn****",
          settlementStatus: "SETTLED",
          settlement: { frozen: 0, withdrawn: 0, refunded: 2, deducted: 1, confiscated: 0 },
          product: {
            id: 101,
            title: "Tượng gỗ trắc",
            description: "Đục tay",
            material: "Gỗ trắc",
            dimensions: "30x20x10",
            weight: "2.5",
            primaryImage: "https://cdn.example/product.jpg",
            images: ["https://cdn.example/product.jpg"],
            appraisal: {
              certificateCode: "CERT-1",
              verifiedMaterial: "Gỗ trắc",
              origin: "Việt Nam",
              ageEstimation: "30 năm",
              conditionGrade: "GOOD",
              estimatedValue: "18000000",
              isAuthentic: true,
            },
          },
          createdAt: "2026-05-24T10:00:00Z",
          updatedAt: "2026-05-25T13:05:00Z",
        }),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(sellerApi.getMyAuctionDetail(501)).resolves.toMatchObject({
      id: "501",
      status: "ENDED_SUCCESS",
      currentPrice: 15000000,
      finalPrice: 15000000,
      reservePrice: 12000000,
      participantCount: 3,
      winnerMaskedAlias: "winn****",
      settlementStatus: "SETTLED",
      settlement: { withdrawn: 0, refunded: 2, deducted: 1 },
      product: { id: 101, title: "Tượng gỗ trắc" },
    });
  });

  it("cancels seller auction session with PATCH", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("patch");
      expect(config.url).toBe("/auctions/501/cancel");

      return createResponse(config, 200, createApiResponse(null));
    };
    apiClient.defaults.adapter = adapter;

    await expect(sellerApi.cancelAuction(501)).resolves.toBeUndefined();
  });
});
