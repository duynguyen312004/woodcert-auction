import axios from "axios";

import type { ApiError, ApiResponse } from "@/shared/api/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiResponseLike(value: unknown): value is Partial<ApiResponse<unknown>> {
  return isRecord(value) && "message" in value;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getStatusCode(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const responseData = error.response?.data;
    const body = isApiResponseLike(responseData) ? responseData : undefined;
    const record = isRecord(responseData) ? responseData : undefined;
    const bodyStatusCode = getStatusCode(body?.statusCode);
    const message =
      getString(body?.message) ??
      getString(record?.error) ??
      error.message ??
      "Unexpected API error";

    return {
      statusCode: bodyStatusCode ?? statusCode,
      message,
      code: getString(record?.code),
      details: responseData,
      isAuthError: (bodyStatusCode ?? statusCode) === 401,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      isAuthError: false,
    };
  }

  return {
    message: "Unexpected API error",
    details: error,
    isAuthError: false,
  };
}
