import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { normalizeApiError } from "@/shared/api/errors";

describe("normalizeApiError", () => {
  it("normalizes backend ApiResponse error payloads", () => {
    const config = {
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig;
    const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, {
      status: 401,
      statusText: "Unauthorized",
      headers: new AxiosHeaders(),
      config,
      data: {
        statusCode: 401,
        message: "Session expired",
        data: null,
        timestamp: "2026-05-09T00:00:00Z",
      },
    });

    expect(normalizeApiError(error)).toMatchObject({
      statusCode: 401,
      message: "Session expired",
      isAuthError: true,
    });
  });

  it("normalizes non-Axios errors", () => {
    expect(normalizeApiError(new Error("Boom"))).toMatchObject({
      message: "Boom",
      isAuthError: false,
    });
  });
});
