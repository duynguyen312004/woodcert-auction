import {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it } from "vitest";

import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { disputeApi } from "./disputeApi";

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

function parseRequestBody(config: InternalAxiosRequestConfig) {
  return typeof config.data === "string" ? JSON.parse(config.data) : config.data;
}

function dispute(status = "OPEN") {
  return {
    id: 31,
    orderId: 91,
    fulfillmentId: 17,
    openedByUserId: "buyer-1",
    status,
    reason: "Sai hang",
    description: "Mo ta",
    openedAt: "2026-06-02T00:00:00Z",
    resolvedAt: null,
    resolvedByAdminId: null,
    resolutionOutcome: null,
    resolutionNote: null,
    evidence: [{ id: 1, mediaId: 101, url: "https://cdn.example/evidence.jpg", sortOrder: 0 }],
  };
}

function disputeDetail(status = "OPEN") {
  return {
    dispute: dispute(status),
    messages: [
      {
        id: 41,
        authorRole: "SELLER",
        content: "Hang giao dung mo ta",
        createdAt: "2026-06-02T00:10:00Z",
        evidence: [],
      },
    ],
  };
}

describe("disputeApi", () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("opens a dispute under the order endpoint with evidence ids", async () => {
    const payload = {
      reason: "Sai hang",
      description: "San pham khac mo ta",
      evidenceMediaIds: [101],
    };
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/orders/91/disputes");
      expect(parseRequestBody(config)).toEqual(payload);

      return createResponse(config, 201, createApiResponse(dispute(), 201));
    };
    apiClient.defaults.adapter = adapter;

    await expect(disputeApi.openDispute(91, payload)).resolves.toMatchObject({
      id: 31,
      orderId: 91,
      status: "OPEN",
    });
  });

  it("fetches the current active dispute for an order", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/orders/91/disputes/current");

      return createResponse(config, 200, createApiResponse(dispute("UNDER_REVIEW")));
    };
    apiClient.defaults.adapter = adapter;

    await expect(disputeApi.getCurrentDispute(91)).resolves.toMatchObject({
      id: 31,
      status: "UNDER_REVIEW",
    });
  });

  it("fetches dispute history for an order", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/orders/91/disputes");

      return createResponse(config, 200, createApiResponse([dispute("RESOLVED"), dispute("OPEN")]));
    };
    apiClient.defaults.adapter = adapter;

    await expect(disputeApi.getDisputeHistory(91)).resolves.toMatchObject([
      { id: 31, status: "RESOLVED" },
      { id: 31, status: "OPEN" },
    ]);
  });

  it("fetches the full participant dispute timeline", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/orders/91/disputes/31");

      return createResponse(config, 200, createApiResponse(disputeDetail()));
    };
    apiClient.defaults.adapter = adapter;

    await expect(disputeApi.getDisputeDetail(91, 31)).resolves.toMatchObject({
      dispute: { id: 31, orderId: 91 },
      messages: [{ id: 41, authorRole: "SELLER" }],
    });
  });

  it("posts a participant message with text and evidence ids", async () => {
    const payload = {
      content: "Anh kien hang",
      evidenceMediaIds: [201, 202],
    };
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/orders/91/disputes/31/messages");
      expect(parseRequestBody(config)).toEqual(payload);

      return createResponse(config, 201, createApiResponse(disputeDetail(), 201));
    };
    apiClient.defaults.adapter = adapter;

    await expect(disputeApi.addParticipantMessage(91, 31, payload)).resolves.toMatchObject({
      dispute: { id: 31 },
    });
  });

  it("fetches admin detail and posts an admin clarification message", async () => {
    const payload = {
      content: "Vui long bo sung hoa don",
      evidenceMediaIds: [],
    };
    let requestCount = 0;
    const adapter: AxiosAdapter = async (config) => {
      requestCount += 1;
      if (requestCount === 1) {
        expect(config.method).toBe("get");
        expect(config.url).toBe("/admin/disputes/31");
        return createResponse(config, 200, createApiResponse(disputeDetail("UNDER_REVIEW")));
      }

      expect(config.method).toBe("post");
      expect(config.url).toBe("/admin/disputes/31/messages");
      expect(parseRequestBody(config)).toEqual(payload);
      return createResponse(
        config,
        201,
        createApiResponse(
          {
            ...disputeDetail("UNDER_REVIEW"),
            messages: [
              {
                id: 42,
                authorRole: "ADMIN",
                content: payload.content,
                createdAt: "2026-06-02T00:20:00Z",
                evidence: [],
              },
            ],
          },
          201,
        ),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(disputeApi.getAdminDispute(31)).resolves.toMatchObject({
      dispute: { status: "UNDER_REVIEW" },
    });
    await expect(disputeApi.addAdminMessage(31, payload)).resolves.toMatchObject({
      messages: [{ authorRole: "ADMIN" }],
    });
  });

  it("resolves an admin dispute with explicit outcome and note", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("patch");
      expect(config.url).toBe("/admin/disputes/31/resolve");
      expect(parseRequestBody(config)).toEqual({
        outcome: "BUYER_WINS",
        resolutionNote: "Hoan tien",
      });

      return createResponse(
        config,
        200,
        createApiResponse({
          ...dispute("RESOLVED"),
          resolvedAt: "2026-06-02T01:00:00Z",
          resolvedByAdminId: "admin-1",
          resolutionOutcome: "BUYER_WINS",
          resolutionNote: "Hoan tien",
        }),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(
      disputeApi.resolveDispute({
        id: 31,
        outcome: "BUYER_WINS",
        resolutionNote: "Hoan tien",
      }),
    ).resolves.toMatchObject({
      status: "RESOLVED",
      resolutionOutcome: "BUYER_WINS",
    });
  });

  it("lists admin disputes with status pagination params", async () => {
    const page: PaginationResponse<ReturnType<typeof dispute>> = {
      meta: { page: 1, pageSize: 10, pages: 1, total: 1 },
      result: [dispute()],
    };
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/admin/disputes");
      expect(config.params).toEqual({ status: "OPEN", page: 1, size: 10 });

      return createResponse(config, 200, createApiResponse(page));
    };
    apiClient.defaults.adapter = adapter;

    await expect(
      disputeApi.getAdminDisputes({ status: "OPEN", page: 1, size: 10 }),
    ).resolves.toMatchObject({ result: [{ id: 31, status: "OPEN" }] });
  });
});
