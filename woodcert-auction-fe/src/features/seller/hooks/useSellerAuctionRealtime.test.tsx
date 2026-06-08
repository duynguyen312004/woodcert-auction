import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { PaginationResponse } from "@/shared/api/types";
import type { AuctionTopicEvent } from "@/shared/realtime/useAuctionTopic";

import type { SellerAuction, SellerAuctionDetail } from "../types";
import { useSellerAuctionRealtime } from "./useSellerAuctionRealtime";

let topicOptions:
  | {
      onEvent: (event: AuctionTopicEvent) => void;
      onConnected?: () => void;
    }
  | undefined;

vi.mock("@/shared/realtime/useAuctionTopic", () => ({
  useAuctionTopic: (options: typeof topicOptions) => {
    topicOptions = options;
    return { status: "connected" };
  },
}));

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useSellerAuctionRealtime", () => {
  it("updates detail and list caches for bids and terminal events", () => {
    const client = new QueryClient();
    client.setQueryData(["seller", "auction", 501], {
      id: "501",
      status: "ACTIVE",
      currentPrice: 10_000_000,
      finalPrice: null,
      endTime: "2026-06-06T12:00:00Z",
      winnerMaskedAlias: null,
    } as SellerAuctionDetail);
    const listKey = ["seller", "auctions", { status: "ACTIVE" }] as const;
    client.setQueryData<PaginationResponse<SellerAuction>>(listKey, {
      meta: { page: 1, pageSize: 10, pages: 1, total: 1 },
      result: [
        {
          id: "501",
          title: "Tuong go",
          productId: "10",
          status: "ACTIVE",
          startingPrice: 10_000_000,
          currentPrice: 10_000_000,
          depositAmount: 1_000_000,
          bidCount: 2,
          startTime: "2026-06-06T10:00:00Z",
          endTime: "2026-06-06T12:00:00Z",
          imageUrl: null,
          createdAt: "2026-06-06T09:00:00Z",
        },
      ],
    });

    renderHook(() => useSellerAuctionRealtime(501), { wrapper: wrapper(client) });

    act(() => {
      topicOptions?.onEvent({
        type: "NEW_BID",
        auctionSessionId: 501,
        status: "ACTIVE",
        currentPrice: 12_000_000,
        endTime: "2026-06-06T12:05:00Z",
        highestBidderMaskedAlias: "bid****",
      });
    });

    expect(client.getQueryData<SellerAuctionDetail>(["seller", "auction", 501])).toMatchObject({
      currentPrice: 12_000_000,
      endTime: "2026-06-06T12:05:00Z",
      winnerMaskedAlias: "bid****",
    });
    expect(
      client.getQueryData<PaginationResponse<SellerAuction>>(listKey)?.result[0],
    ).toMatchObject({
      currentPrice: 12_000_000,
      endTime: "2026-06-06T12:05:00Z",
    });

    act(() => {
      topicOptions?.onEvent({
        type: "SESSION_ENDED",
        auctionSessionId: 501,
        status: "ENDED_SUCCESS",
        currentPrice: 12_000_000,
      });
    });

    expect(client.getQueryData<SellerAuctionDetail>(["seller", "auction", 501])).toMatchObject({
      status: "ENDED_SUCCESS",
      finalPrice: 12_000_000,
    });
  });
});
