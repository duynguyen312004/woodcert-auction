import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BiddingAuctionDetail, NewBidPayload, ParticipationStatus } from "../types";

type SocketOptions = {
  auctionId: string | number;
  onNewBid: (payload: NewBidPayload) => void;
  onSessionActivated: (payload: unknown) => void;
  onSessionEnded: (payload: unknown) => void;
  onConnected?: () => void;
};

const socketMock = vi.hoisted(() => ({
  options: null as SocketOptions | null,
}));

vi.mock("@/shared/ui/notification", () => ({
  useNotification: () => ({
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock("./useAuctionDetail", () => ({
  useAuctionDetail: () => ({ data: null, isError: false, isLoading: false, refetch: vi.fn() }),
}));

vi.mock("./useAuctionSocket", () => ({
  useAuctionSocket: (options: SocketOptions) => {
    socketMock.options = options;
    return { status: "connected" };
  },
}));

vi.mock("./useBidHistory", () => ({
  useBidHistory: () => ({ data: [], isError: false, isLoading: false, refetch: vi.fn() }),
}));

vi.mock("./useParticipation", () => ({
  useParticipation: () => ({ data: null, isError: false, isLoading: false, refetch: vi.fn() }),
}));

vi.mock("./usePlaceBid", () => ({
  usePlaceBid: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("./useRegisterAuction", () => ({
  useRegisterAuction: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

import { useBiddingRoom } from "./useBiddingRoom";

function Harness() {
  useBiddingRoom(501);
  return null;
}

function createDetail(): BiddingAuctionDetail {
  return {
    currentPrice: 1_200_000,
    depositAmount: 100_000,
    endTime: "2026-06-03T11:00:00Z",
    highestBidderMaskedAlias: "old****",
    id: 501,
    product: null,
    seller: null,
    startTime: "2026-06-03T10:00:00Z",
    startingPrice: 1_000_000,
    status: "ACTIVE",
    stepPrice: 100_000,
  };
}

function createParticipation(): ParticipationStatus {
  return {
    canBid: true,
    canRegister: false,
    canWithdraw: false,
    depositAmount: 100_000,
    depositStatus: "FROZEN",
    highestBidder: false,
    outcomeCode: "NONE",
    outcomeMessage: "",
    reasonCode: "CAN_BID",
    reasonMessage: "You can place bids in this auction",
    registered: true,
    sellerOwned: false,
    winner: false,
  };
}

describe("useBiddingRoom", () => {
  afterEach(() => {
    socketMock.options = null;
    vi.clearAllMocks();
  });

  it("patches NEW_BID cache without immediate invalidation", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    queryClient.setQueryData(["auctions", "detail", "501"], createDetail());
    queryClient.setQueryData(["auctions", "bids", "501", { size: 20 }], []);
    queryClient.setQueryData(["auctions", "participation", "501"], createParticipation());

    render(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    );

    const payload: NewBidPayload = {
      auctionId: 501,
      bidHistoryItem: {
        bidAmount: 1_400_000,
        bidderMaskedAlias: "new****",
        bidTime: "2026-06-03T10:05:00Z",
        bidTraceId: "trace-1",
        mine: false,
      },
      currentPrice: 1_400_000,
      endTime: "2026-06-03T11:01:00Z",
      highestBidderMaskedAlias: "new****",
    };

    act(() => {
      socketMock.options?.onNewBid(payload);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryData<BiddingAuctionDetail>(["auctions", "detail", "501"]),
    ).toMatchObject({
      currentPrice: 1_400_000,
      endTime: "2026-06-03T11:01:00Z",
      highestBidderMaskedAlias: "new****",
    });
    expect(
      queryClient.getQueryData<NewBidPayload["bidHistoryItem"][]>([
        "auctions",
        "bids",
        "501",
        { size: 20 },
      ])?.[0],
    ).toMatchObject({
      bidAmount: 1_400_000,
      bidTraceId: "trace-1",
    });
  });
});
