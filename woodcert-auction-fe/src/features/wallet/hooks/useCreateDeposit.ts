import { useMutation } from "@tanstack/react-query";
import { walletApi } from "../api/wallet";

export function useCreateDeposit() {
  return useMutation({
    mutationFn: (amount: number) => walletApi.createDeposit(amount),
    onSuccess: (result) => {
      // Lưu lại txnRef để trang kết quả có thể đối chiếu hoặc polling
      sessionStorage.setItem("last_txn_ref", result.txnRef);
      // Chuyển hướng sang VNPay Sandbox
      window.location.href = result.paymentUrl;
    },
  });
}
