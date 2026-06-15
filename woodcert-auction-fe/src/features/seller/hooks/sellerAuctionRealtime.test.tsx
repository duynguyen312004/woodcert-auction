import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PaginationResponse } from "@/shared/api/types";

vi.mock("@/features/order", () => ({
  mapOrder: (order: unknown) => order,
  useSellerOrders: () => ({
    data: {
      result: [],
      meta: { page: 1, pageSize: 3, pages: 0, total: 0 },
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useSellerSalesSummary: () => ({
    data: { totalRealizedIncome: 0 },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

import { sellerApi } from "../api/seller";
import type { SellerAuction, SellerAuctionDetail, SellerAuctionStats } from "../types";
import { useCancelAuction } from "./useProductMutations";
import {
  useSellerAuctionDetail,
  useSellerAuctions,
  useSellerAuctionStats,
  useSellerDashboard,
} from "./useSellerDashboard";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function auction(): SellerAuction {
  return {
    id: "501",
    title: "Tượng gỗ",
    productId: "101",
    status: "WAITING",
    startingPrice: 10_000_000,
    currentPrice: 10_000_000,
    depositAmount: 1_000_000,
    bidCount: 0,
    startTime: "2026-06-06T12:00:00Z",
    endTime: "2026-06-06T14:00:00Z",
    imageUrl: null,
    createdAt: "2026-06-06T10:00:00Z",
  };
}

function page(result: SellerAuction[]): PaginationResponse<SellerAuction> {
  return {
    result,
    meta: { page: 1, pageSize: 10, pages: 1, total: result.length },
  };
}

describe("seller auction realtime cache", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates list, detail and stats immediately after cancellation", async () => {
    const queryClient = createQueryClient();
    const waitingKey = ["seller", "auctions", { page: 1, size: 10, status: "WAITING" }] as const;
    const allKey = ["seller", "auctions", { page: 1, size: 10 }] as const;
    const detailKey = ["seller", "auction", 501] as const;
    const statsKey = ["seller", "auction-stats"] as const;

    queryClient.setQueryData(waitingKey, page([auction()]));
    queryClient.setQueryData(allKey, page([auction()]));
    queryClient.setQueryData(detailKey, {
      id: "501",
      status: "WAITING",
    } as SellerAuctionDetail);
    queryClient.setQueryData<SellerAuctionStats>(statsKey, {
      waiting: 1,
      active: 0,
      endedSuccess: 0,
      endedFailed: 0,
      canceled: 0,
    });
    vi.spyOn(sellerApi, "cancelAuction").mockResolvedValue(undefined);

    const { result } = renderHook(() => useCancelAuction(), {
      wrapper: createWrapper(queryClient),
    });

    await act(() => result.current.mutateAsync(501));

    expect(queryClient.getQueryData<PaginationResponse<SellerAuction>>(waitingKey)?.result).toEqual(
      [],
    );
    expect(
      queryClient.getQueryData<PaginationResponse<SellerAuction>>(allKey)?.result[0]?.status,
    ).toBe("CANCELED");
    expect(queryClient.getQueryData<SellerAuctionDetail>(detailKey)?.status).toBe("CANCELED");
    expect(queryClient.getQueryData<SellerAuctionStats>(statsKey)).toMatchObject({
      waiting: 0,
      canceled: 1,
    });
  });

  it("keeps seller auction list and stats fresh while polling every ten seconds", () => {
    const queryClient = createQueryClient();
    vi.spyOn(sellerApi, "getMyAuctions").mockResolvedValue(page([]));
    vi.spyOn(sellerApi, "getMyAuctionStats").mockResolvedValue({
      waiting: 0,
      active: 0,
      endedSuccess: 0,
      endedFailed: 0,
      canceled: 0,
    });
    vi.spyOn(sellerApi, "getMyAuctionDetail").mockResolvedValue({
      id: "501",
      status: "ACTIVE",
    } as SellerAuctionDetail);

    renderHook(
      () => {
        useSellerAuctions({ page: 1, size: 10 });
        useSellerAuctionStats();
        useSellerAuctionDetail(501);
      },
      { wrapper: createWrapper(queryClient) },
    );

    const listOptions = queryClient.getQueryCache().find({
      queryKey: ["seller", "auctions", { page: 1, size: 10 }],
    })?.options as
      | {
          refetchInterval?: unknown;
          refetchOnMount?: unknown;
          refetchOnWindowFocus?: unknown;
        }
      | undefined;
    const statsOptions = queryClient.getQueryCache().find({
      queryKey: ["seller", "auction-stats"],
    })?.options as
      | {
          refetchInterval?: unknown;
          refetchOnMount?: unknown;
          refetchOnWindowFocus?: unknown;
        }
      | undefined;
    expect(listOptions?.refetchInterval).toBe(10_000);
    expect(listOptions?.refetchOnMount).toBe("always");
    expect(listOptions?.refetchOnWindowFocus).toBe(true);
    expect(statsOptions?.refetchInterval).toBe(10_000);
    expect(statsOptions?.refetchOnMount).toBe("always");
    expect(statsOptions?.refetchOnWindowFocus).toBe(true);

    const detailInterval = (
      queryClient.getQueryCache().find({
        queryKey: ["seller", "auction", 501],
      })?.options as { refetchInterval?: unknown } | undefined
    )?.refetchInterval;
    expect(typeof detailInterval).toBe("function");
  });

  it("uses the dedicated auction stats endpoint for the dashboard active count", async () => {
    const queryClient = createQueryClient();
    vi.spyOn(sellerApi, "getMyProducts").mockResolvedValue({
      result: [],
      meta: { page: 1, pageSize: 5, pages: 0, total: 0 },
    });
    vi.spyOn(sellerApi, "getMyProductStats").mockResolvedValue({
      total: 1,
      byStatus: {
        DRAFT: 0,
        PENDING_APPRAISAL: 0,
        UNDER_APPRAISAL: 0,
        REJECTED: 0,
        APPRAISED: 8,
      },
      bySaleStatus: {
        AVAILABLE: 2,
        IN_AUCTION: 1,
        PENDING_ORDER: 0,
        SOLD: 5,
        RETURNED: 0,
      },
      auctionReadyCount: 2,
    });
    vi.spyOn(sellerApi, "getMyAuctions").mockResolvedValue(page([]));
    vi.spyOn(sellerApi, "getMyAuctionStats").mockResolvedValue({
      waiting: 0,
      active: 1,
      endedSuccess: 0,
      endedFailed: 0,
      canceled: 0,
    });

    const { result } = renderHook(() => useSellerDashboard(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.stats.activeAuctionCount).toBe(1));
    await waitFor(() => expect(result.current.stats.auctionReadyCount).toBe(2));
    await waitFor(() =>
      expect(sellerApi.getMyAuctions).toHaveBeenCalledWith({ status: "ACTIVE", size: 1 }),
    );
    await waitFor(() => {
      const activeCalls = vi
        .mocked(sellerApi.getMyAuctions)
        .mock.calls.filter(([params]) => params?.status === "ACTIVE");
      expect(activeCalls).toHaveLength(2);
    });
  });
});
