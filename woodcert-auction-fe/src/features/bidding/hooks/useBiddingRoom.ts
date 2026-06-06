import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import { useNotification } from "@/shared/ui/notification";
import { useAuctionDetail } from "./useAuctionDetail";
import { useAuctionSocket } from "./useAuctionSocket";
import { useBidHistory } from "./useBidHistory";
import { useParticipation } from "./useParticipation";
import { usePlaceBid } from "./usePlaceBid";
import { useRegisterAuction } from "./useRegisterAuction";
import { useWithdrawAuction } from "./useWithdrawAuction";
import type {
  BiddingAuctionDetail,
  BidHistoryItem,
  NewBidPayload,
  OutbidAlert,
  ParticipationStatus,
  PlaceBidResult,
} from "../types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export function useBiddingRoom(auctionId: string | number) {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const auctionIdString = auctionId.toString();

  const detailQuery = useAuctionDetail(auctionId);
  const participationQuery = useParticipation(auctionId);
  const bidsQuery = useBidHistory(auctionId);
  const placeBidMutation = usePlaceBid(auctionId);
  const registerMutation = useRegisterAuction(auctionId);
  const withdrawMutation = useWithdrawAuction(auctionId);

  const [extensionSeconds, setExtensionSeconds] = useState<number | null>(null);
  const [outbidAlert, setOutbidAlert] = useState<OutbidAlert | null>(null);
  const ownBidTraceIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (extensionSeconds === null) return;
    const timer = window.setTimeout(() => setExtensionSeconds(null), 5000);
    return () => window.clearTimeout(timer);
  }, [extensionSeconds]);

  useEffect(() => {
    if (outbidAlert === null) return;
    const timer = window.setTimeout(() => setOutbidAlert(null), 5000);
    return () => window.clearTimeout(timer);
  }, [outbidAlert]);

  const markCurrentUserAsHighestBidder = useCallback(
    (result: PlaceBidResult) => {
      ownBidTraceIdsRef.current.add(result.bidTraceId);
      queryClient.setQueryData<ParticipationStatus>(
        ["auctions", "participation", auctionIdString],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            highestBidder: true,
            canRegister: false,
            canBid: false,
            reasonCode: "CURRENT_HIGHEST_BIDDER",
            reasonMessage: "You are currently the highest bidder",
          };
        },
      );
    },
    [auctionIdString, queryClient],
  );

  const placeBid = useCallback(
    async (amount: number) => {
      const result = await placeBidMutation.mutateAsync(amount);
      markCurrentUserAsHighestBidder(result);
      return result;
    },
    [markCurrentUserAsHighestBidder, placeBidMutation],
  );

  const handleNewBid = useCallback(
    (payload: NewBidPayload) => {
      const bidTraceId = payload.bidHistoryItem.bidTraceId;
      const isOwnBid = Boolean(bidTraceId) && ownBidTraceIdsRef.current.has(bidTraceId);
      const bidHistoryItem: BidHistoryItem = {
        ...payload.bidHistoryItem,
        mine: isOwnBid || payload.bidHistoryItem.mine,
      };
      const participationKey = ["auctions", "participation", auctionIdString] as const;
      const currentParticipation = queryClient.getQueryData<ParticipationStatus>(participationKey);
      const wasOutbid = Boolean(currentParticipation?.highestBidder && !isOwnBid);

      queryClient.setQueryData<BiddingAuctionDetail>(
        ["auctions", "detail", auctionIdString],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            currentPrice: payload.currentPrice,
            endTime: payload.endTime,
            highestBidderMaskedAlias: payload.highestBidderMaskedAlias,
          };
        },
      );

      queryClient.setQueryData<BidHistoryItem[]>(
        ["auctions", "bids", auctionIdString, { size: 20 }],
        (old) => {
          if (!old) return [bidHistoryItem];
          if (old.some((bid) => bid.bidTraceId === bidHistoryItem.bidTraceId)) {
            return old.map((bid) =>
              bid.bidTraceId === bidHistoryItem.bidTraceId
                ? { ...bid, mine: bid.mine || isOwnBid }
                : bid,
            );
          }
          return [bidHistoryItem, ...old].slice(0, 20);
        },
      );

      queryClient.setQueryData<ParticipationStatus>(participationKey, (old) => {
        if (!old) return old;
        if (isOwnBid) {
          return {
            ...old,
            highestBidder: true,
            canRegister: false,
            canBid: false,
            reasonCode: "CURRENT_HIGHEST_BIDDER",
            reasonMessage: "You are currently the highest bidder",
          };
        }
        if (!old.highestBidder) {
          return old;
        }
        return {
          ...old,
          highestBidder: false,
          canBid:
            old.registered && old.depositStatus === "FROZEN" && old.reasonCode !== "AUCTION_ENDED",
          reasonCode: "CAN_BID",
          reasonMessage: "You can place bids in this auction",
        };
      });

      if (wasOutbid) {
        notification.warning("Bạn vừa bị vượt giá", {
          description: `Giá mới là ${formatCurrency(payload.currentPrice)}. Bạn có thể đặt lại nếu muốn tiếp tục.`,
          duration: 6500,
        });
        setOutbidAlert({
          id: Date.now(),
          price: payload.currentPrice,
        });
      }

      if (payload.extendedBySeconds) {
        setExtensionSeconds(payload.extendedBySeconds);
      }
    },
    [auctionIdString, notification, queryClient],
  );

  const handleSessionActivated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auctions", "detail", auctionIdString] });
    queryClient.invalidateQueries({ queryKey: ["auctions", "participation", auctionIdString] });
    queryClient.invalidateQueries({ queryKey: ["auctions", "bids", auctionIdString] });
  }, [auctionIdString, queryClient]);

  const handleSessionEnded = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["auctions", "detail", auctionIdString] });
    queryClient.invalidateQueries({ queryKey: ["auctions", "participation", auctionIdString] });
    queryClient.invalidateQueries({ queryKey: ["auctions", "bids", auctionIdString] });
  }, [auctionIdString, queryClient]);

  const handleSocketConnected = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["auctions", "detail", auctionIdString],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["auctions", "participation", auctionIdString],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["auctions", "bids", auctionIdString],
      refetchType: "all",
    });
  }, [auctionIdString, queryClient]);

  const { status: socketStatus } = useAuctionSocket({
    auctionId,
    onNewBid: handleNewBid,
    onSessionActivated: handleSessionActivated,
    onSessionEnded: handleSessionEnded,
    onConnected: handleSocketConnected,
  });

  return {
    detail: detailQuery.data || null,
    participation: participationQuery.data || null,
    bids: bidsQuery.data || [],
    isLoading: detailQuery.isLoading || participationQuery.isLoading || bidsQuery.isLoading,
    isError: detailQuery.isError || participationQuery.isError,
    socketStatus,
    placeBid,
    isPlacingBid: placeBidMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    withdraw: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending,
    extensionSeconds,
    outbidAlert,
    refetchAll: () => {
      detailQuery.refetch();
      participationQuery.refetch();
      bidsQuery.refetch();
    },
  };
}
