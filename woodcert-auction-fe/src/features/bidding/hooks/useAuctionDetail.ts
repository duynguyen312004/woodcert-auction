/**
 * Hook tải thông tin chi tiết phiên đấu giá.
 *
 * Sử dụng useQuery từ react-query để fetch dữ liệu từ REST API
 * và cache lại với key ["auctions", "detail", auctionId].
 */

import { useQuery } from "@tanstack/react-query";
import { getBiddingAuctionDetail } from "../api/bidding";

export function useAuctionDetail(auctionId: string | number) {
  return useQuery({
    queryKey: ["auctions", "detail", auctionId.toString()] as const,
    queryFn: () => getBiddingAuctionDetail(auctionId),
    enabled: Boolean(auctionId),
    refetchOnWindowFocus: false,
  });
}
