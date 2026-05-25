import {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it } from "vitest";

import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { appraisalApi } from "./appraisal";

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
    timestamp: "2026-05-25T00:00:00Z",
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

describe("appraisalApi", () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("submits proof image descriptions with appraisal payload", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/products/101/appraise");
      expect(JSON.parse(config.data as string)).toMatchObject({
        isAuthentic: true,
        proofImages: [{ mediaId: 501, description: "End-grain close-up" }],
      });

      return createResponse(
        config,
        201,
        createApiResponse(
          {
            reportId: 42,
            productId: 101,
            certificateCode: "CERT-2026-00042",
            newProductStatus: "APPRAISED",
          },
          201,
        ),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(
      appraisalApi.submitAppraisal(101, {
        isAuthentic: true,
        verifiedMaterial: "Dalbergia tonkinensis",
        estimatedValue: 15000000,
        sellerAccuracy: 4.5,
        proofImages: [{ mediaId: 501, description: "End-grain close-up" }],
      }),
    ).resolves.toMatchObject({ certificateCode: "CERT-2026-00042" });
  });

  it("fetches rejected reviewed products when reviewStatus is REJECTED", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/products");
      expect(config.params).toMatchObject({ page: 2, status: "REJECTED" });

      return createResponse(config, 200, createApiResponse(paginated([])));
    };
    apiClient.defaults.adapter = adapter;

    await expect(
      appraisalApi.getReviewed({ page: 2, size: 10, reviewStatus: "REJECTED" }),
    ).resolves.toMatchObject({ result: [] });
  });
});
