import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PaginationResponse } from "@/shared/api/types";

import { sellerApi } from "../api/seller";
import type { SellerAuction, SellerAuctionDetail, SellerAuctionStats } from "../types";
import { useCancelAuction } from "./useProductMutations";
import {
  useSellerAuctionDetail,
  useSellerAuctions,
  useSellerAuctionStats,
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

  it("polls seller auction list, stats and live detail every five seconds", () => {
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

    expect(
      queryClient.getQueryCache().find({
        queryKey: ["seller", "auctions", { page: 1, size: 10 }],
      })?.options.refetchInterval,
    ).toBe(5_000);
    expect(
      queryClient.getQueryCache().find({ queryKey: ["seller", "auction-stats"] })?.options
        .refetchInterval,
    ).toBe(5_000);

    const detailInterval = queryClient.getQueryCache().find({
      queryKey: ["seller", "auction", 501],
    })?.options.refetchInterval;
    expect(typeof detailInterval).toBe("function");
  });
});
