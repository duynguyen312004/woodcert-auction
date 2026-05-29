import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

// DTO khớp WalletRes từ backend
export interface WalletBalance {
  id: number;
  userId: string;
  availableBalance: number;
  frozenBalance: number;
}

// DTO khớp WalletTransactionRes
export interface WalletTransaction {
  id: number;
  amount: number;
  type: "DEPOSIT" | "WITHDRAW" | "FREEZE" | "UNFREEZE" | "PAYMENT";
  referenceId: number | null;
  referenceType: "AUCTION" | "ORDER" | "SYSTEM" | "VNPAY_DEPOSIT";
  status: "SUCCESS" | "FAILED" | "PENDING";
  createdAt: string;
  description: string;
}

// DTO VNPay deposit
export interface VnPayDeposit {
  id: number;
  txnRef: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  vnpBankCode: string | null;
  createdAt: string;
  paidAt: string | null;
}

export const walletApi = {
  /**
   * GET /wallets/me — Lấy số dư và tỷ lệ cọc của ví người dùng.
   */
  getBalance: async (): Promise<WalletBalance> => {
    const response = await apiClient.get<ApiResponse<WalletBalance>>("/wallets/me");
    return unwrapApiResponse(response);
  },

  /**
   * GET /wallets/me/transactions — Lấy lịch sử giao dịch của ví.
   */
  getTransactions: async (
    page: number,
    size: number,
  ): Promise<PaginationResponse<WalletTransaction>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<WalletTransaction>>>(
      `/wallets/me/transactions?page=${page}&size=${size}`,
    );
    return unwrapApiResponse(response);
  },

  /**
   * POST /wallets/me/deposit — Tạo giao dịch nạp tiền VNPay và lấy URL thanh toán.
   */
  createDeposit: async (amount: number): Promise<{ paymentUrl: string; txnRef: string }> => {
    const response = await apiClient.post<ApiResponse<{ paymentUrl: string; txnRef: string }>>(
      "/wallets/me/deposit",
      { amount },
    );
    return unwrapApiResponse(response);
  },

  /**
   * GET /wallets/me/deposits/{txnRef} — Lấy trạng thái của giao dịch nạp tiền VNPay.
   */
  getDepositStatus: async (txnRef: string): Promise<VnPayDeposit> => {
    const response = await apiClient.get<ApiResponse<VnPayDeposit>>(
      `/wallets/me/deposits/${txnRef}`,
    );
    return unwrapApiResponse(response);
  },

  /**
   * GET /wallets/me/deposits — Lấy danh sách giao dịch nạp tiền VNPay.
   */
  getDeposits: async (page: number, size: number): Promise<PaginationResponse<VnPayDeposit>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<VnPayDeposit>>>(
      `/wallets/me/deposits?page=${page}&size=${size}`,
    );
    return unwrapApiResponse(response);
  },
};
