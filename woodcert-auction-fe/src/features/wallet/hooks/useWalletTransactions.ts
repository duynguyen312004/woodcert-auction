import { useQuery } from "@tanstack/react-query";
import { walletApi } from "../api/wallet";

export const WALLET_TRANSACTIONS_QUERY_KEY = ["wallet", "transactions"] as const;

export function useWalletTransactions(page: number, size: number) {
  return useQuery({
    queryKey: [...WALLET_TRANSACTIONS_QUERY_KEY, { page, size }],
    queryFn: () => walletApi.getTransactions(page, size),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 10, // 10s
  });
}
