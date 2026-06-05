import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

export interface AdminAuditLog {
  id: number;
  actorAdminId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
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

function normalizeFilters(filters: AuditLogFilters) {
  return {
    ...filters,
    from: toInstantParam(filters.from, "start"),
    to: toInstantParam(filters.to, "end"),
  };
}

export const auditLogApi = {
  getLogs: async (filters: AuditLogFilters = {}): Promise<PaginationResponse<AdminAuditLog>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<AdminAuditLog>>>(
      "/admin/audit-logs",
      { params: normalizeFilters(filters) },
    );
    return unwrapApiResponse(response);
  },
};
