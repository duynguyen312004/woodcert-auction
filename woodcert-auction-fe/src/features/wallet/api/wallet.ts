import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

export interface WalletBalance {
  id: string;
  userId: string;
  balance: number;
  depositRate: number;
}

export const walletApi = {
  /**
   * GET /wallets/me — Lấy số dư và tỷ lệ cọc của ví người dùng.
   */
  getBalance: async (): Promise<WalletBalance> => {
    const response = await apiClient.get<ApiResponse<WalletBalance>>("/wallets/me");
    return unwrapApiResponse(response);
  },
};
