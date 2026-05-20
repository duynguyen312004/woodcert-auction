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

  it("normalizes backend validation field errors", () => {
    const config = {
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig;
    const error = new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, {
      status: 400,
      statusText: "Bad Request",
      headers: new AxiosHeaders(),
      config,
      data: {
        statusCode: 400,
        message: "Validation failed",
        data: {
          email: "Invalid email format",
          password: "Password must be between 8 and 72 characters",
        },
        timestamp: "2026-05-09T00:00:00Z",
      },
    });

    expect(normalizeApiError(error)).toMatchObject({
      statusCode: 400,
      message: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
      fieldErrors: {
        email: "Vui lòng nhập địa chỉ email hợp lệ.",
        password: "Mật khẩu phải có từ 8 đến 72 ký tự.",
      },
    });
  });

  it("normalizes non-Axios errors", () => {
    expect(normalizeApiError(new Error("Boom"))).toMatchObject({
      message: "Boom",
      isAuthError: false,
    });
  });
});
