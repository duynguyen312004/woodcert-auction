import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

import type { SellerAuction } from "../types";
import { SellerAuctionsPage } from "./SellerAuctionsPage";

const cancelMutateAsync = vi.fn();

vi.mock("@/shared/ui/notification", () => ({
  useNotification: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/shared/lib/format", () => ({
  formatDate: (value: string | undefined) => value ?? "—",
  formatDateTime: (value: string | undefined) => value ?? "—",
  formatVND: (value: number) => `${value} đ`,
}));

vi.mock("../hooks/useProductMutations", () => ({
  useCancelAuction: () => ({
    mutateAsync: cancelMutateAsync,
    isPending: false,
  }),
}));

vi.mock("../hooks/useSellerDashboard", () => ({
  useSellerAuctions: vi.fn(),
  useSellerAuctionStats: vi.fn(),
}));

import { useSellerAuctions, useSellerAuctionStats } from "../hooks/useSellerDashboard";

function makeAuction(overrides: Partial<SellerAuction> = {}): SellerAuction {
  return {
    id: "501",
    title: "Tượng gỗ trắc",
    productId: "101",
    status: "WAITING",
    startingPrice: 10000000,
    currentPrice: 10000000,
    depositAmount: 1000000,
    bidCount: 0,
    startTime: "2026-05-25T11:00:00Z",
    endTime: "2026-05-25T13:00:00Z",
    imageUrl: null,
    createdAt: "2026-05-25T10:00:00Z",
    ...overrides,
  };
}

function makeQueryResult(items: SellerAuction[]) {
  return {
    data: {
      result: items,
      meta: { page: 1, pageSize: 10, pages: 1, total: items.length },
    },
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  };
}

function makeStatsQueryResult(overrides = {}) {
  return {
    data: {
      waiting: 1,
      active: 1,
      endedSuccess: 0,
      endedFailed: 0,
      canceled: 0,
      ...overrides,
    },
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SellerAuctionsPage />
    </MemoryRouter>,
  );
}

describe("SellerAuctionsPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows cancel action only for WAITING auctions", () => {
    vi.mocked(useSellerAuctions).mockReturnValue(
      makeQueryResult([
        makeAuction({ id: "501", status: "WAITING" }),
        makeAuction({ id: "502", status: "ACTIVE" }),
      ]) as unknown as ReturnType<typeof useSellerAuctions>,
    );
    vi.mocked(useSellerAuctionStats).mockReturnValue(
      makeStatsQueryResult() as unknown as ReturnType<typeof useSellerAuctionStats>,
    );

    renderPage();

    expect(screen.getByRole("button", { name: /^hủy$/i })).toBeVisible();
    expect(screen.getAllByRole("link", { name: /xem/i })).toHaveLength(2);
  });

  it("shows empty state when seller has no auctions", () => {
    vi.mocked(useSellerAuctions).mockReturnValue(
      makeQueryResult([]) as unknown as ReturnType<typeof useSellerAuctions>,
    );
    vi.mocked(useSellerAuctionStats).mockReturnValue(
      makeStatsQueryResult({ waiting: 0, active: 0 }) as unknown as ReturnType<
        typeof useSellerAuctionStats
      >,
    );

    renderPage();

    expect(screen.getByText("Bạn chưa có phiên đấu giá nào.")).toBeVisible();
    expect(screen.getByRole("link", { name: /tạo phiên đấu giá/i })).toBeVisible();
  });
});
