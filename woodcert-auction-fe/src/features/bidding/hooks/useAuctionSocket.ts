import { useCallback } from "react";

import {
  useAuctionTopic,
  type AuctionTopicConnectionStatus,
  type AuctionTopicEvent,
} from "@/shared/realtime/useAuctionTopic";

import type { NewBidPayload, SessionEndedPayload } from "../types";

export type ConnectionStatus = AuctionTopicConnectionStatus;

interface UseAuctionSocketOptions {
  auctionId: string | number;
  onNewBid: (payload: NewBidPayload) => void;
  onSessionActivated: (payload: SessionEndedPayload) => void;
  onSessionEnded: (payload: SessionEndedPayload) => void;
  onConnected?: () => void;
}

function toNumber(value: string | number | null | undefined, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useAuctionSocket({
  auctionId,
  onNewBid,
  onSessionActivated,
  onSessionEnded,
  onConnected,
}: UseAuctionSocketOptions) {
  const onEvent = useCallback(
    (event: AuctionTopicEvent) => {
      if (event.type === "NEW_BID") {
        if (
          !event.bidTraceId ||
          event.bidAmount === undefined ||
          !event.bidTime ||
          !event.endTime
        ) {
          return;
        }
        onNewBid({
          auctionId: event.auctionSessionId,
          currentPrice: toNumber(event.currentPrice),
          endTime: event.endTime,
          highestBidderMaskedAlias: event.highestBidderMaskedAlias ?? null,
          bidHistoryItem: {
            bidTraceId: event.bidTraceId,
            bidAmount: toNumber(event.bidAmount),
            bidderMaskedAlias: event.highestBidderMaskedAlias ?? "****",
            bidTime: event.bidTime,
            mine: false,
          },
          extendedBySeconds: event.extendedBySeconds ?? undefined,
        });
        return;
      }

      const payload = {
        auctionId: event.auctionSessionId,
        status: event.status as SessionEndedPayload["status"],
      };
      if (event.type === "SESSION_ACTIVATED") onSessionActivated(payload);
      if (event.type === "SESSION_ENDED") onSessionEnded(payload);
    },
    [onNewBid, onSessionActivated, onSessionEnded],
  );

  return useAuctionTopic({ auctionId, onEvent, onConnected });
}
