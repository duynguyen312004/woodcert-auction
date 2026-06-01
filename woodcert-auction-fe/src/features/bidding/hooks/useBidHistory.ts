/**
 * Hook tải lịch sử đặt giá của phiên đấu giá.
 *
 * Mặc định tải 20 lượt bid gần nhất, lưu trong cache với key:
 * ["auctions", "bids", auctionId, { size: 20 }].
 */

import { useQuery } from "@tanstack/react-query";
import { getBiddingHistory } from "../api/bidding";

export function useBidHistory(auctionId: string | number) {
  return useQuery({
    queryKey: ["auctions", "bids", auctionId.toString(), { size: 20 }] as const,
    queryFn: () => getBiddingHistory(auctionId, 20),
    enabled: Boolean(auctionId),
    refetchOnWindowFocus: false,
  });
}
