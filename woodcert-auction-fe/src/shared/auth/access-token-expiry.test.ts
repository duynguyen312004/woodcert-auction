import { describe, expect, it } from "vitest";

import {
  getAccessTokenExpiryMs,
  getAccessTokenRefreshDelayMs,
  shouldRefreshAccessToken,
} from "@/shared/auth/access-token-expiry";

function encodeBase64Url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createToken(payload: object) {
  return ["header", encodeBase64Url(payload), "signature"].join(".");
}

describe("access token expiry helpers", () => {
  it("extracts the JWT exp claim as milliseconds", () => {
    const token = createToken({ exp: 1_800 });

    expect(getAccessTokenExpiryMs(token)).toBe(1_800_000);
  });

  it("returns null for malformed tokens", () => {
    expect(getAccessTokenExpiryMs("not-a-jwt")).toBeNull();
    expect(getAccessTokenExpiryMs(createToken({ sub: "user-1" }))).toBeNull();
  });

  it("calculates the proactive refresh delay before expiry", () => {
    const token = createToken({ exp: 200 });

    expect(getAccessTokenRefreshDelayMs(token, 50_000, 90_000)).toBe(60_000);
    expect(getAccessTokenRefreshDelayMs(token, 120_000, 90_000)).toBe(0);
  });

  it("detects tokens that are inside the refresh lead window", () => {
    const token = createToken({ exp: 200 });

    expect(shouldRefreshAccessToken(token, 50_000, 90_000)).toBe(false);
    expect(shouldRefreshAccessToken(token, 120_000, 90_000)).toBe(true);
  });
});
