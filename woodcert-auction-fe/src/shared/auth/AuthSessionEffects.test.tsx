import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthSessionEffects } from "@/shared/auth/AuthSessionEffects";
import { clearAuthSession, setAccessToken } from "@/shared/auth/auth-store";

const { refreshAccessTokenMock } = vi.hoisted(() => ({
  refreshAccessTokenMock: vi.fn<() => Promise<string>>(),
}));

vi.mock("@/shared/api/client", () => ({
  refreshAccessToken: refreshAccessTokenMock,
}));

function encodeBase64Url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createToken(expiryMs: number) {
  return ["header", encodeBase64Url({ exp: Math.floor(expiryMs / 1000) }), "signature"].join(".");
}

function setVisibilityState(value: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  });
}

describe("AuthSessionEffects", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-20T00:00:00.000Z"));
    refreshAccessTokenMock.mockClear();
    refreshAccessTokenMock.mockResolvedValue("next-token");
    setVisibilityState("visible");
  });

  afterEach(() => {
    cleanup();
    clearAuthSession();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("schedules proactive refresh before access token expiry", () => {
    setAccessToken(createToken(Date.now() + 120_000));
    render(<AuthSessionEffects />);

    act(() => {
      vi.advanceTimersByTime(29_999);
    });
    expect(refreshAccessTokenMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1);
  });

  it("clears the previous timer when access token changes", () => {
    const { rerender } = render(<AuthSessionEffects />);

    act(() => {
      setAccessToken(createToken(Date.now() + 120_000));
    });
    rerender(<AuthSessionEffects />);

    act(() => {
      setAccessToken(createToken(Date.now() + 300_000));
    });
    rerender(<AuthSessionEffects />);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(refreshAccessTokenMock).not.toHaveBeenCalled();
  });

  it("clears the proactive timer when the session is cleared", () => {
    const { rerender } = render(<AuthSessionEffects />);

    act(() => {
      setAccessToken(createToken(Date.now() + 120_000));
    });
    rerender(<AuthSessionEffects />);

    act(() => {
      clearAuthSession();
    });
    rerender(<AuthSessionEffects />);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(refreshAccessTokenMock).not.toHaveBeenCalled();
  });

  it("refreshes on tab return only when token is near expiry", () => {
    setAccessToken(createToken(Date.now() + 60_000));
    render(<AuthSessionEffects />);

    act(() => {
      setVisibilityState("visible");
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1);
  });

  it("does not refresh on tab return when token has enough remaining lifetime", () => {
    setAccessToken(createToken(Date.now() + 300_000));
    render(<AuthSessionEffects />);

    act(() => {
      setVisibilityState("visible");
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(refreshAccessTokenMock).not.toHaveBeenCalled();
  });
});
