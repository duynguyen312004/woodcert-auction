import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { buyerAuctionApi } from "../api/buyerAuctionApi";

export function useBuyerAuctions(params?: { page?: number; size?: number; outcome?: string }) {
  return useQuery({
    queryKey: ["buyer", "auctions", params] as const,
    queryFn: () => buyerAuctionApi.getMyAuctions(params),
  });
}

export function useBuyerAuctionStats() {
  return useQuery({
    queryKey: ["buyer", "auction-stats"] as const,
    queryFn: buyerAuctionApi.getStats,
  });
}

export function useBuyerAuctionDetail(auctionId: number | undefined) {
  return useQuery({
    queryKey: ["buyer", "auction", auctionId] as const,
    queryFn: () => buyerAuctionApi.getDetail(auctionId as number),
    enabled: auctionId !== undefined,
  });
}

export function usePayRemainder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: buyerAuctionApi.payRemainder,
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ["buyer", "auction", order.sourceId] });
      void queryClient.invalidateQueries({ queryKey: ["buyer", "auctions"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
    },
  });
}

export function useConfirmReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: buyerAuctionApi.confirmReceived,
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ["buyer", "auction", order.sourceId] });
      void queryClient.invalidateQueries({ queryKey: ["buyer", "auctions"] });
    },
  });
}
