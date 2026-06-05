import { afterEach, describe, expect, it, vi } from "vitest";

import { getServerClockOffset, getServerNow, updateServerClockOffset } from "./serverClock";

describe("serverClock", () => {
  afterEach(() => {
    vi.useRealTimers();
    updateServerClockOffset(Date.now(), Date.now());
  });

  it("returns local time adjusted by the latest server offset", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T00:00:00Z"));

    updateServerClockOffset(Date.now() + 5_000, Date.now());

    expect(getServerClockOffset()).toBe(5_000);
    expect(getServerNow()).toBe(Date.now() + 5_000);
  });
});
