/**
 * Hook thực hiện đăng ký tham gia (đặt cọc ký quỹ) phiên đấu giá.
 *
 * Gửi yêu cầu POST /auctions/{id}/register. Sau khi thành công,
 * tự động refetch trạng thái đăng ký và số dư ví của người dùng.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerAuction } from "../api/bidding";

export function useRegisterAuction(auctionId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => registerAuction(auctionId),
    onSuccess: () => {
      // Invalidate thông tin tham gia đấu giá
      queryClient.invalidateQueries({
        queryKey: ["auctions", "participation", auctionId.toString()],
      });
      // Invalidate số dư ví tiền
      queryClient.invalidateQueries({
        queryKey: ["wallet", "me"],
      });
    },
  });
}
