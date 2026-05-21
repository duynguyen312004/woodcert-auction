/**
 * Test nhanh cách accountApi gọi request.
 *
 * Test thay adapter của Axios để kiểm tra đúng endpoint, method và payload mà
 * không cần chạy backend hay mock React Query.
 */
import {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it } from "vitest";

import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { accountApi } from "./account";

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
    timestamp: "2026-05-19T00:00:00Z",
  };
}

function parseRequestBody(config: InternalAxiosRequestConfig) {
  return typeof config.data === "string" ? JSON.parse(config.data) : config.data;
}

describe("accountApi avatar endpoints", () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("sends file metadata when requesting an avatar upload intent", async () => {
    const payload = {
      originalFileName: "avatar.jpg",
      contentType: "image/jpeg",
      fileSize: 1024,
    };

    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/users/me/avatar/upload-intent");
      expect(parseRequestBody(config)).toEqual(payload);

      return createResponse(
        config,
        201,
        createApiResponse(
          {
            mediaId: 101,
            uploadUrl: "https://api.cloudinary.com/v1_1/demo/image/upload",
            cloudName: "demo",
            apiKey: "api-key",
            assetFolder: "woodcert/dev/users/user-1/avatar",
            publicId: "woodcert/dev/users/user-1/avatar/101",
            resourceType: "image",
            timestamp: 1775700000,
            signature: "signed",
          },
          201,
        ),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(accountApi.requestAvatarUploadIntent(payload)).resolves.toMatchObject({
      mediaId: 101,
      apiKey: "api-key",
    });
  });

  it("confirms avatar uploads with numeric mediaId and Cloudinary assetId", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("put");
      expect(config.url).toBe("/users/me/avatar");
      expect(parseRequestBody(config)).toEqual({ mediaId: 101, assetId: "asset-101" });

      return createResponse(
        config,
        200,
        createApiResponse({
          id: "user-1",
          email: "user@example.com",
          fullName: "User One",
          phoneNumber: "0911222333",
          avatarUrl: "https://res.cloudinary.com/avatar",
          status: "ACTIVE",
          roles: ["ROLE_BIDDER"],
          createdAt: "2026-03-28T10:00:00Z",
          hasSellerProfile: false,
        }),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(accountApi.confirmAvatarUpload(101, "asset-101")).resolves.toMatchObject({
      avatarUrl: "https://res.cloudinary.com/avatar",
    });
  });

  it("deletes the current avatar", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("delete");
      expect(config.url).toBe("/users/me/avatar");

      return createResponse(
        config,
        200,
        createApiResponse({
          id: "user-1",
          email: "user@example.com",
          fullName: "User One",
          phoneNumber: "0911222333",
          avatarUrl: null,
          status: "ACTIVE",
          roles: ["ROLE_BIDDER"],
          createdAt: "2026-03-28T10:00:00Z",
          hasSellerProfile: false,
        }),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(accountApi.deleteAvatar()).resolves.toMatchObject({ avatarUrl: null });
  });

  it("creates a seller profile with nullable tax code", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/users/me/seller-profile");
      expect(parseRequestBody(config)).toEqual({
        storeName: "WoodCert Studio",
        identityCardNumber: "012345678901",
        taxCode: null,
      });

      return createResponse(
        config,
        201,
        createApiResponse(
          {
            userId: "user-1",
            storeName: "WoodCert Studio",
            identityCardNumber: "012345678901",
            taxCode: null,
            reputationScore: 5,
            createdAt: "2026-05-21T00:00:00Z",
            updatedAt: "2026-05-21T00:00:00Z",
          },
          201,
        ),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(
      accountApi.createSellerProfile({
        storeName: "WoodCert Studio",
        identityCardNumber: "012345678901",
        taxCode: "",
      }),
    ).resolves.toMatchObject({ storeName: "WoodCert Studio" });
  });
});
