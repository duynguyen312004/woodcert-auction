import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

export type PlatformRevenueType = "APPRAISAL_FEE" | "SALE_COMMISSION" | "FORFEITED_DEPOSIT_FEE";

export interface PlatformRevenueTransaction {
  id: number;
  type: PlatformRevenueType;
  amount: number;
  sourceUserId: string | null;
  referenceType: string;
  referenceId: number | null;
  operationKey: string;
  createdAt: string;
}

export interface PlatformRevenueStats {
  totalAmount: number;
  byType: Partial<Record<PlatformRevenueType, { amount: number; count: number }>>;
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const revenueApi = {
  getTransactions: async (): Promise<PaginationResponse<PlatformRevenueTransaction>> => {
    const response = await apiClient.get<
      ApiResponse<PaginationResponse<PlatformRevenueTransaction>>
    >("/admin/revenue", { params: { size: 20 } });
    const data = unwrapApiResponse(response);
    return {
      ...data,
      result: data.result.map((item) => ({ ...item, amount: toNumber(item.amount) })),
    };
  },

  getStats: async (): Promise<PlatformRevenueStats> => {
    const response = await apiClient.get<ApiResponse<PlatformRevenueStats>>("/admin/revenue/stats");
    const data = unwrapApiResponse(response);
    return { ...data, totalAmount: toNumber(data.totalAmount) };
  },
};
