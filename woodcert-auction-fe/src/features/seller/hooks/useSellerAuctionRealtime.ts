import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { PaginationResponse } from "@/shared/api/types";
import { useAuctionTopic, type AuctionTopicEvent } from "@/shared/realtime/useAuctionTopic";

import type { SellerAuction, SellerAuctionDetail, SellerAuctionStatus } from "../types";

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function useSellerAuctionRealtime(auctionId: number | undefined) {
  const queryClient = useQueryClient();
  const refreshRelated = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["seller", "auctions"] });
    void queryClient.invalidateQueries({ queryKey: ["seller", "auction-stats"] });
    void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard"] });
  }, [queryClient]);

  const onEvent = useCallback(
    (event: AuctionTopicEvent) => {
      if (!auctionId || event.auctionSessionId !== auctionId) return;
      queryClient.setQueryData<SellerAuctionDetail>(["seller", "auction", auctionId], (current) => {
        if (!current) return current;
        const currentPrice = toNumber(event.currentPrice);
        const status = event.status as SellerAuctionStatus;
        return {
          ...current,
          status: status || current.status,
          currentPrice: currentPrice ?? current.currentPrice,
          finalPrice:
            event.type === "SESSION_ENDED"
              ? (currentPrice ?? current.finalPrice ?? current.currentPrice)
              : current.finalPrice,
          endTime: event.endTime ?? current.endTime,
          winnerMaskedAlias: event.highestBidderMaskedAlias ?? current.winnerMaskedAlias,
        };
      });
      queryClient
        .getQueriesData<PaginationResponse<SellerAuction>>({
          queryKey: ["seller", "auctions"],
        })
        .forEach(([queryKey, current]) => {
          if (!current) return;
          queryClient.setQueryData<PaginationResponse<SellerAuction>>(queryKey, {
            ...current,
            result: current.result.map((auction) =>
              Number(auction.id) === auctionId
                ? {
                    ...auction,
                    status: event.status as SellerAuctionStatus,
                    currentPrice: toNumber(event.currentPrice) ?? auction.currentPrice,
                    endTime: event.endTime ?? auction.endTime,
                  }
                : auction,
            ),
          });
        });

      if (event.type === "SESSION_ACTIVATED" || event.type === "SESSION_ENDED") {
        refreshRelated();
      }
    },
    [auctionId, queryClient, refreshRelated],
  );

  return useAuctionTopic({
    auctionId,
    onEvent,
    onConnected: () => {
      if (auctionId) {
        void queryClient.invalidateQueries({ queryKey: ["seller", "auction", auctionId] });
      }
    },
  });
}
