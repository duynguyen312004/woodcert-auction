/**
 * Hook thực hiện hành động đặt giá (place bid).
 *
 * Sử dụng useMutation gửi request POST /bids. Không tối ưu hóa giao diện (optimistic update)
 * mà đợi sự kiện WebSocket hoặc refetch để xác nhận kết quả.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { placeBid } from "../api/bidding";
import type { PlaceBidResult } from "../types";

export function usePlaceBid(auctionId: string | number) {
  const queryClient = useQueryClient();

  return useMutation<PlaceBidResult, Error, number>({
    mutationFn: (bidAmount: number) => placeBid(Number(auctionId), bidAmount),
    onSuccess: () => {
      // Invalidate các query liên quan để đồng bộ nền trong trường hợp WebSocket bị chậm.
      queryClient.invalidateQueries({ queryKey: ["auctions", "detail", auctionId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["auctions", "bids", auctionId.toString()] });
    },
  });
}
