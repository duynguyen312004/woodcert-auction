import { afterEach, describe, expect, it } from "vitest";

import { clearAuthSession, setAccessToken } from "@/shared/auth/auth-store";
import { queryClient } from "@/shared/query/query-client";

function encodeBase64Url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createToken(userId: string) {
  return ["header", encodeBase64Url({ sub: userId }), "signature"].join(".");
}

describe("auth-store session cache handling", () => {
  afterEach(() => {
    clearAuthSession();
  });

  it("clears query cache when access token switches to another user", () => {
    setAccessToken(createToken("admin-1"));
    queryClient.setQueryData(["account", "profile"], { id: "admin-1" });

    setAccessToken(createToken("appraiser-1"));

    expect(queryClient.getQueryData(["account", "profile"])).toBeUndefined();
  });

  it("keeps query cache when access token refreshes for the same user", () => {
    setAccessToken(createToken("user-1"));
    queryClient.setQueryData(["account", "profile"], { id: "user-1" });

    setAccessToken(createToken("user-1"));

    expect(queryClient.getQueryData(["account", "profile"])).toEqual({ id: "user-1" });
  });

  it("clears query cache when session is cleared", () => {
    queryClient.setQueryData(["account", "profile"], { id: "admin-1" });

    clearAuthSession();

    expect(queryClient.getQueryData(["account", "profile"])).toBeUndefined();
  });
});
