import axios from "axios";

import type { ApiError, ApiResponse } from "@/shared/api/types";
import { API_ERROR_MESSAGES } from "./error-messages";

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

function translateApiMessage(message: string) {
  return API_ERROR_MESSAGES[message] ?? message;
}

function getFieldErrors(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }

  return Object.entries(value).reduce<Record<string, string>>((errors, [field, message]) => {
    if (typeof message === "string") {
      errors[field] = translateApiMessage(message);
    }

    return errors;
  }, {});
}

export function isApiError(value: unknown): value is ApiError {
  return (
    isRecord(value) && typeof value.message === "string" && typeof value.isAuthError === "boolean"
  );
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const responseData = error.response?.data;
    const body = isApiResponseLike(responseData) ? responseData : undefined;
    const record = isRecord(responseData) ? responseData : undefined;
    const bodyStatusCode = getStatusCode(body?.statusCode);
    const rawMessage =
      getString(body?.message) ??
      getString(record?.error) ??
      error.message ??
      "Unexpected API error";

    const fieldErrors = getFieldErrors(body?.data);
    const message = translateApiMessage(rawMessage);

    return {
      statusCode: bodyStatusCode ?? statusCode,
      message,
      code: getString(body?.errorCode) ?? getString(record?.code),
      fieldErrors: fieldErrors && Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
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
