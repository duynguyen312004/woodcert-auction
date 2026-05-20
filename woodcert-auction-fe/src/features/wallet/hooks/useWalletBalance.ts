import { useQuery } from "@tanstack/react-query";

import { walletApi } from "../api/wallet";

export const WALLET_BALANCE_QUERY_KEY = ["wallet", "me"] as const;

/**
 * useWalletBalance — Lấy số dư ví của người dùng đang đăng nhập.
 * Chỉ fetch khi có session (isAuthenticated).
 * Query key: ["wallet", "me"]
 */
export function useWalletBalance(enabled = true) {
  return useQuery({
    queryKey: WALLET_BALANCE_QUERY_KEY,
    queryFn: walletApi.getBalance,
    enabled,
    staleTime: 1000 * 30, // 30s — ví thay đổi thường xuyên hơn profile
    retry: false, // không retry vì 404 = chưa có ví (bình thường)
  });
}
