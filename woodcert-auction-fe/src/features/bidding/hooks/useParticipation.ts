/**
 * Hook tải thông tin tham gia/ký quỹ phiên đấu giá của người dùng hiện tại.
 *
 * Lưu dữ liệu trong react-query cache với key ["auctions", "participation", auctionId].
 */

import { useQuery } from "@tanstack/react-query";
import { getBiddingParticipation } from "../api/bidding";

export function useParticipation(auctionId: string | number) {
  return useQuery({
    queryKey: ["auctions", "participation", auctionId.toString()] as const,
    queryFn: () => getBiddingParticipation(auctionId),
    enabled: Boolean(auctionId),
    refetchOnWindowFocus: false,
  });
}
