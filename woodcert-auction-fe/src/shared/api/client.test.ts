import {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient, apiRequest } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { clearAuthSession, getAccessToken, setAccessToken } from "@/shared/auth/auth-store";

type AdapterScenario = {
  refreshCount: number;
  protectedCount: number;
};

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
    timestamp: "2026-05-09T00:00:00Z",
  };
}

function createSingleFlightAdapter(scenario: AdapterScenario): AxiosAdapter {
  return async (config) => {
    if (config.url === "/auth/refresh") {
      scenario.refreshCount += 1;

      await Promise.resolve();

      return createResponse(config, 200, createApiResponse({ accessToken: "next-token" }));
    }

    if (config.url === "/private-resource") {
      scenario.protectedCount += 1;

      if (config.headers.get("Authorization") !== "Bearer next-token") {
        return Promise.reject({
          isAxiosError: true,
          config,
          response: createResponse(config, 401, createApiResponse(null, 401)),
          message: "Unauthorized",
          toJSON: () => ({}),
        });
      }

      return createResponse(config, 200, createApiResponse({ ok: true }));
    }

    throw new Error(`Unhandled test URL: ${config.url ?? "unknown"}`);
  };
}

describe("apiClient refresh flow", () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    clearAuthSession();
    vi.restoreAllMocks();
  });

  it("shares one refresh request across concurrent 401 responses and retries once", async () => {
    const scenario: AdapterScenario = {
      refreshCount: 0,
      protectedCount: 0,
    };
    apiClient.defaults.adapter = createSingleFlightAdapter(scenario);
    setAccessToken("expired-token");

    const [firstResult, secondResult] = await Promise.all([
      apiRequest<{ ok: boolean }>({
        method: "GET",
        url: "/private-resource",
        requiresAuth: true,
      }),
      apiRequest<{ ok: boolean }>({
        method: "GET",
        url: "/private-resource",
        requiresAuth: true,
      }),
    ]);

    expect(firstResult).toEqual({ ok: true });
    expect(secondResult).toEqual({ ok: true });
    expect(scenario.refreshCount).toBe(1);
    expect(scenario.protectedCount).toBe(4);
    expect(getAccessToken()).toBe("next-token");
  });
});
