import { useMutation, useQueryClient } from "@tanstack/react-query";

import { withdrawAuction } from "../api/bidding";

export function useWithdrawAuction(auctionId: string | number) {
  const queryClient = useQueryClient();
  const auctionIdString = auctionId.toString();

  return useMutation({
    mutationFn: () => withdrawAuction(auctionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["auctions", "participation", auctionIdString],
      });
      void queryClient.invalidateQueries({
        queryKey: ["auctions", "detail", auctionIdString],
      });
      void queryClient.invalidateQueries({ queryKey: ["auctions", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["buyer", "auctions"] });
      void queryClient.invalidateQueries({ queryKey: ["buyer", "auction", Number(auctionId)] });
      void queryClient.invalidateQueries({ queryKey: ["buyer", "auction-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet", "me"] });
    },
  });
}
