import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

import { normalizeApiError } from "@/shared/api/errors";
import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";
import { clearAuthSession, getAccessToken, setAccessToken } from "@/shared/auth/auth-store";
import { env } from "@/shared/config/env";

declare module "axios" {
  export interface AxiosRequestConfig {
    requiresAuth?: boolean;
    skipAuthRefresh?: boolean;
    skipAutoRetry?: boolean;
    _retry?: boolean;
  }
}

type RefreshPayload = {
  accessToken?: string;
  token?: string;
};

type RefreshResult = RefreshPayload | string | null;

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
});

let refreshPromise: Promise<string> | null = null;

function extractAccessToken(result: RefreshResult) {
  if (typeof result === "string") {
    return result;
  }

  return result?.accessToken ?? result?.token;
}

async function requestRefreshToken() {
  const response = await apiClient.request<ApiResponse<RefreshResult>>({
    method: "POST",
    url: "/auth/refresh",
    withCredentials: true,
    skipAuthRefresh: true,
  });
  const nextAccessToken = extractAccessToken(unwrapApiResponse(response));

  if (!nextAccessToken) {
    throw new Error("Refresh response did not include an access token.");
  }

  setAccessToken(nextAccessToken);
  return nextAccessToken;
}

function getSharedRefreshPromise() {
  refreshPromise ??= requestRefreshToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function isRetryEligible(error: AxiosError) {
  const config = error.config;

  return (
    error.response?.status === 401 &&
    Boolean(config) &&
    !config?._retry &&
    !config?.skipAuthRefresh &&
    !config?.skipAutoRetry
  );
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    config.withCredentials = true;
  }

  if (config.requiresAuth) {
    config.withCredentials = true;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !isRetryEligible(error)) {
      return Promise.reject(normalizeApiError(error));
    }

    const originalConfig = error.config;

    if (!originalConfig) {
      return Promise.reject(normalizeApiError(error));
    }

    originalConfig._retry = true;

    try {
      const nextAccessToken = await getSharedRefreshPromise();
      originalConfig.headers.Authorization = `Bearer ${nextAccessToken}`;
      originalConfig.withCredentials = true;

      return await apiClient.request(originalConfig);
    } catch (refreshError) {
      clearAuthSession();
      return Promise.reject(normalizeApiError(refreshError));
    }
  },
);

export async function apiRequest<T>(config: AxiosRequestConfig) {
  const response = await apiClient.request<ApiResponse<T>>(config);
  return unwrapApiResponse(response);
}
