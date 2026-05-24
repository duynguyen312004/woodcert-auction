import {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { uploadProductImage } from "./mediaApi";

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

function createFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("uploadProductImage", () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it("requests intent, uploads to Cloudinary, confirms, and returns mediaId", async () => {
    const calls: Array<{ method?: string; url?: string; data?: unknown }> = [];
    const adapter: AxiosAdapter = async (config) => {
      calls.push({
        method: config.method,
        url: config.url,
        data: typeof config.data === "string" ? JSON.parse(config.data) : config.data,
      });

      if (config.url === "/products/images/upload-intent") {
        return createResponse(
          config,
          201,
          createApiResponse({
            mediaId: 222,
            uploadUrl: "https://api.cloudinary.com/v1_1/demo/image/upload",
            cloudName: "demo",
            apiKey: "api-key",
            assetFolder: "woodcert/dev/users/seller-1/products",
            publicId: "woodcert/dev/users/seller-1/products/222",
            resourceType: "image",
            timestamp: 1775700000,
            signature: "signed",
          }),
        );
      }

      if (config.url === "/products/images/confirm") {
        return createResponse(config, 200, createApiResponse(null));
      }

      throw new Error(`Unexpected request: ${config.method} ${config.url}`);
    };
    apiClient.defaults.adapter = adapter;

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ asset_id: "cloudinary-asset-222" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(uploadProductImage(createFile("product.webp", "image/webp", 1024))).resolves.toBe(
      222,
    );

    expect(calls).toEqual([
      {
        method: "post",
        url: "/products/images/upload-intent",
        data: {
          originalFileName: "product.webp",
          contentType: "image/webp",
          fileSize: 1024,
        },
      },
      {
        method: "put",
        url: "/products/images/confirm",
        data: {
          mediaId: 222,
          assetId: "cloudinary-asset-222",
        },
      },
    ]);
  });
});
