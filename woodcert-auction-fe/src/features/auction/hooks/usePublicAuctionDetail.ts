/**
 * Hook lấy chi tiết public của một phiên đấu giá.
 *
 * Trang chi tiết public và phòng bidding dùng chung query key để dữ liệu REST luôn
 * được tái sử dụng và đồng bộ sau các cập nhật realtime.
 */
import { useQuery } from "@tanstack/react-query";

import { getPublicAuctionDetail } from "../api/auctions";

export function usePublicAuctionDetail(auctionId: string | number) {
  return useQuery({
    queryKey: ["auctions", "detail", auctionId.toString()] as const,
    queryFn: () => getPublicAuctionDetail(auctionId),
    enabled: Boolean(auctionId),
    refetchOnWindowFocus: false,
  });
}
