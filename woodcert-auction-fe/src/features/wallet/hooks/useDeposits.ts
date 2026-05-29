import { useQuery } from "@tanstack/react-query";
import { walletApi } from "../api/wallet";

export const WALLET_DEPOSITS_QUERY_KEY = ["wallet", "deposits"] as const;

export function useDeposits(page: number, size: number) {
  return useQuery({
    queryKey: [...WALLET_DEPOSITS_QUERY_KEY, { page, size }],
    queryFn: () => walletApi.getDeposits(page, size),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 10,
  });
}
