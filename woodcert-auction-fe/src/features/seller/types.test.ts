import { afterEach, describe, expect, it, vi } from "vitest";

import { createAuctionSessionSchema } from "./types";

const validAuctionForm = {
  productId: 101,
  startingPrice: "10000000",
  reservePrice: "12000000",
  stepPrice: "100000",
  depositAmount: "1000000",
  startTime: "2026-05-25T11:00",
  endTime: "2026-05-25T13:00",
};

describe("createAuctionSessionSchema", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a valid seller auction session form", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T10:00:00"));

    expect(createAuctionSessionSchema.safeParse(validAuctionForm).success).toBe(true);
  });

  it("accepts money fields grouped with spaces", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T10:00:00"));

    expect(
      createAuctionSessionSchema.safeParse({
        ...validAuctionForm,
        startingPrice: "10 000 000",
        reservePrice: "12 000 000",
        stepPrice: "100 000",
        depositAmount: "1 000 000",
      }).success,
    ).toBe(true);
  });

  it("rejects reserve price lower than starting price", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T10:00:00"));

    const result = createAuctionSessionSchema.safeParse({
      ...validAuctionForm,
      reservePrice: "9000000",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === "reservePrice")).toBe(true);
  });

  it("rejects deposit outside backend limits", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T10:00:00"));

    const lowDeposit = createAuctionSessionSchema.safeParse({
      ...validAuctionForm,
      depositAmount: "999999",
    });
    const highDeposit = createAuctionSessionSchema.safeParse({
      ...validAuctionForm,
      depositAmount: "6000000",
    });

    expect(lowDeposit.success).toBe(false);
    expect(highDeposit.success).toBe(false);
  });

  it("rejects start time that is too soon", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T10:00:00"));

    const result = createAuctionSessionSchema.safeParse({
      ...validAuctionForm,
      startTime: "2026-05-25T10:04",
      endTime: "2026-05-25T12:04",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === "startTime")).toBe(true);
  });

  it("accepts the backend minimum start lead time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T10:00:00"));

    const result = createAuctionSessionSchema.safeParse({
      ...validAuctionForm,
      startTime: "2026-05-25T10:05",
      endTime: "2026-05-25T11:05",
    });

    expect(result.success).toBe(true);
  });

  it("rejects duration shorter than one hour or longer than thirty days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T10:00:00"));

    const shortSession = createAuctionSessionSchema.safeParse({
      ...validAuctionForm,
      endTime: "2026-05-25T11:30",
    });
    const longSession = createAuctionSessionSchema.safeParse({
      ...validAuctionForm,
      endTime: "2026-06-30T11:00",
    });

    expect(shortSession.success).toBe(false);
    expect(longSession.success).toBe(false);
  });
});
