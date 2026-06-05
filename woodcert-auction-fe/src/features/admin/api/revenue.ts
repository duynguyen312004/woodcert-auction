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

export interface RevenueFilters {
  type?: PlatformRevenueType;
  from?: string;
  to?: string;
  q?: string;
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toInstantParam(value: string | undefined, boundary: "start" | "end") {
  if (!value) return undefined;
  if (value.includes("T")) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const date =
    boundary === "start"
      ? new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0)
      : new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
  return date.toISOString();
}

function normalizeFilters(filters: RevenueFilters = {}) {
  return {
    ...filters,
    from: toInstantParam(filters.from, "start"),
    to: toInstantParam(filters.to, "end"),
  };
}

export const revenueApi = {
  getTransactions: async (
    page = 1,
    filters: RevenueFilters = {},
  ): Promise<PaginationResponse<PlatformRevenueTransaction>> => {
    const response = await apiClient.get<
      ApiResponse<PaginationResponse<PlatformRevenueTransaction>>
    >("/admin/revenue", { params: { page, size: 20, ...normalizeFilters(filters) } });
    const data = unwrapApiResponse(response);
    return {
      ...data,
      result: data.result.map((item) => ({ ...item, amount: toNumber(item.amount) })),
    };
  },

  getStats: async (filters: RevenueFilters = {}): Promise<PlatformRevenueStats> => {
    const response = await apiClient.get<ApiResponse<PlatformRevenueStats>>(
      "/admin/revenue/stats",
      {
        params: normalizeFilters(filters),
      },
    );
    const data = unwrapApiResponse(response);
    return {
      ...data,
      totalAmount: toNumber(data.totalAmount),
      byType: Object.fromEntries(
        Object.entries(data.byType ?? {}).map(([type, value]) => [
          type,
          { ...value, amount: toNumber(value?.amount) },
        ]),
      ),
    };
  },

  exportCsv: async (filters: RevenueFilters = {}): Promise<Blob> => {
    const response = await apiClient.get<Blob>("/admin/revenue/export", {
      params: normalizeFilters(filters),
      responseType: "blob",
    });
    return response.data;
  },
};
