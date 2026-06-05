import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, RefreshCw, Search, X } from "lucide-react";

import { formatDateTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Pagination } from "@/shared/ui/pagination";

import { auditLogApi, type AuditLogFilters } from "../api/auditLogs";
import { AdminEmptyState } from "../components/AdminEmptyState";

const ACTION_FILTERS = [
  "",
  "ACCOUNT_BANNED",
  "ACCOUNT_UNBANNED",
  "BUYER_BANNED",
  "BUYER_UNBANNED",
  "SELLER_BANNED",
  "SELLER_UNBANNED",
  "APPRAISER_CREATED",
  "APPRAISER_BANNED",
  "APPRAISER_UNBANNED",
  "DISPUTE_RESOLVED",
  "REVENUE_EXPORTED",
];

const TARGET_FILTERS = ["", "USER", "CATEGORY", "DISPUTE", "REVENUE"];

function compactMetadata(metadata: string | null) {
  if (!metadata) return "-";
  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>;
    return Object.entries(parsed)
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ");
  } catch {
    return metadata;
  }
}

export function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [targetId, setTargetId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filters = useMemo<AuditLogFilters>(
    () => ({
      actorId: actorId.trim() || undefined,
      action: action || undefined,
      targetType: targetType || undefined,
      targetId: targetId.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      size: 20,
    }),
    [action, actorId, from, page, targetId, targetType, to],
  );

  const logsQuery = useQuery({
    queryKey: ["admin", "audit-logs", filters],
    queryFn: () => auditLogApi.getLogs(filters),
  });

  const logs = logsQuery.data?.result ?? [];
  const meta = logsQuery.data?.meta;
  const hasFilters = Boolean(
    actorId.trim() || action || targetType || targetId.trim() || from || to,
  );

  const resetFilters = () => {
    setActorId("");
    setAction("");
    setTargetType("");
    setTargetId("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const resetPage = () => setPage(1);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Audit Logs</h1>
          </div>
          <Button type="button" variant="outline" onClick={() => void logsQuery.refetch()}>
            <RefreshCw className={cn("h-4 w-4", logsQuery.isFetching && "animate-spin")} />
            Làm mới
          </Button>
        </header>

        <section className="rounded-lg border border-white/10 bg-card p-5 text-foreground">
          <div className="grid gap-3 lg:grid-cols-[1fr_190px_160px_1fr_160px_160px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a49a88]" />
              <Input
                className="border-white/10 bg-white/5 pl-9 text-foreground placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-primary/20"
                value={actorId}
                onChange={(event) => {
                  setActorId(event.target.value);
                  resetPage();
                }}
                placeholder="Actor admin id"
              />
            </div>
            <select
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                resetPage();
              }}
              className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            >
              {ACTION_FILTERS.map((item) => (
                <option key={item || "ALL"} value={item} className="bg-[#171511]">
                  {item || "Tất cả action"}
                </option>
              ))}
            </select>
            <select
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value);
                resetPage();
              }}
              className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            >
              {TARGET_FILTERS.map((item) => (
                <option key={item || "ALL"} value={item} className="bg-[#171511]">
                  {item || "Tất cả target"}
                </option>
              ))}
            </select>
            <Input
              className="border-white/10 bg-white/5 text-foreground placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-primary/20"
              value={targetId}
              onChange={(event) => {
                setTargetId(event.target.value);
                resetPage();
              }}
              placeholder="Target id"
            />
            <Input
              type="date"
              className="border-white/10 bg-white/5 text-foreground focus-visible:border-primary/50 focus-visible:ring-primary/20"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                resetPage();
              }}
            />
            <Input
              type="date"
              className="border-white/10 bg-white/5 text-foreground focus-visible:border-primary/50 focus-visible:ring-primary/20"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                resetPage();
              }}
            />
            <Button type="button" variant="outline" onClick={resetFilters} disabled={!hasFilters}>
              <X className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-card text-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <h2 className="font-bold text-[#f2eee5]">Lịch sử thao tác admin</h2>
            <p className="text-xs font-semibold text-[#a49a88]">{meta?.total ?? 0} bản ghi</p>
          </div>
          {logs.length === 0 ? (
            <AdminEmptyState
              icon={ClipboardList}
              title="Chưa có audit log phù hợp"
              description="Thử đổi bộ lọc hoặc làm mới để xem các thao tác admin mới nhất."
              action={
                <Button type="button" variant="outline" onClick={() => void logsQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" />
                  Làm mới
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase text-[#a49a88]">
                    <tr>
                      <th className="px-5 py-3">Thời gian</th>
                      <th className="px-5 py-3">Actor</th>
                      <th className="px-5 py-3">Action</th>
                      <th className="px-5 py-3">Target</th>
                      <th className="px-5 py-3">Reason</th>
                      <th className="px-5 py-3">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {logs.map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-white/5">
                        <td className="px-5 py-3 text-[#a49a88]">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-5 py-3 text-xs text-[#d2c5b2]">{log.actorAdminId}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[#d2c5b2]">
                          {log.targetType} #{log.targetId}
                        </td>
                        <td className="max-w-[260px] px-5 py-3 text-[#d2c5b2]">
                          <p className="line-clamp-3 whitespace-pre-wrap">{log.reason ?? "-"}</p>
                        </td>
                        <td className="max-w-[360px] px-5 py-3 text-xs text-[#a49a88]">
                          <p className="line-clamp-3">{compactMetadata(log.metadata)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-white/10 px-5 py-4">
                <Pagination page={meta?.page ?? page} pages={meta?.pages ?? 1} onPage={setPage} />
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
