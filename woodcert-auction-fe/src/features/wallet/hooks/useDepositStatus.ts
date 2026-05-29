import { useQuery } from "@tanstack/react-query";
import { walletApi } from "../api/wallet";

export function useDepositStatus(txnRef: string | null) {
  return useQuery({
    queryKey: ["wallet", "deposit", txnRef],
    queryFn: () => {
      if (!txnRef) throw new Error("No txnRef provided");
      return walletApi.getDepositStatus(txnRef);
    },
    enabled: !!txnRef,
    refetchInterval: (query) => {
      const deposit = query.state.data;
      return deposit && deposit.status === "PENDING" ? 2000 : false;
    },
  });
}
