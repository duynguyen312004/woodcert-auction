import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Banknote, BarChart3, Download, ReceiptText, RefreshCw, Search, X } from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useNotification } from "@/shared/ui/notification";
import { Pagination } from "@/shared/ui/pagination";

import { revenueApi, type PlatformRevenueType, type RevenueFilters } from "../api/revenue";
import { AdminEmptyState } from "../components/AdminEmptyState";

const TYPE_LABEL: Record<PlatformRevenueType, string> = {
  APPRAISAL_FEE: "Phí kiểm định",
  SALE_COMMISSION: "Hoa hồng bán",
  FORFEITED_DEPOSIT_FEE: "Phí cọc phạt",
};

const TYPE_COLOR: Record<PlatformRevenueType, string> = {
  APPRAISAL_FEE: "#d6a84f",
  SALE_COMMISSION: "#2f7d68",
  FORFEITED_DEPOSIT_FEE: "#b5533e",
};

const TYPE_FILTERS: Array<{ label: string; value?: PlatformRevenueType }> = [
  { label: "Tất cả" },
  { label: TYPE_LABEL.APPRAISAL_FEE, value: "APPRAISAL_FEE" },
  { label: TYPE_LABEL.SALE_COMMISSION, value: "SALE_COMMISSION" },
  { label: TYPE_LABEL.FORFEITED_DEPOSIT_FEE, value: "FORFEITED_DEPOSIT_FEE" },
];

export function AdminRevenuePage() {
  const notification = useNotification();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<PlatformRevenueType | undefined>();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  const filters = useMemo<RevenueFilters>(
    () => ({
      type,
      from: from || undefined,
      to: to || undefined,
      q: q.trim() || undefined,
    }),
    [from, q, to, type],
  );

  const statsQuery = useQuery({
    queryKey: ["admin", "revenue", "stats", filters],
    queryFn: () => revenueApi.getStats(filters),
  });
  const txQuery = useQuery({
    queryKey: ["admin", "revenue", "transactions", page, filters],
    queryFn: () => revenueApi.getTransactions(page, filters),
  });

  const exportMutation = useMutation({
    mutationFn: () => revenueApi.exportCsv(filters),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `woodcert-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      notification.success("Đã xuất CSV doanh thu");
    },
    onError: (error) =>
      notification.error("Không thể xuất CSV", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });

  const stats = statsQuery.data;
  const transactions = txQuery.data?.result ?? [];
  const txMeta = txQuery.data?.meta;

  const chartData = useMemo(() => {
    const data = (Object.keys(TYPE_LABEL) as PlatformRevenueType[]).map((revenueType) => ({
      type: revenueType,
      label: TYPE_LABEL[revenueType],
      amount: stats?.byType?.[revenueType]?.amount ?? 0,
      count: stats?.byType?.[revenueType]?.count ?? 0,
      color: TYPE_COLOR[revenueType],
    }));
    const maxAmount = Math.max(...data.map((item) => item.amount), 1);
    const total = Math.max(stats?.totalAmount ?? 0, 0);
    return {
      data,
      maxAmount,
      total,
      hasRevenue: total > 0,
    };
  }, [stats]);

  const donutBackground = useMemo(() => {
    if (!chartData.hasRevenue) {
      return "rgba(255, 255, 255, 0.06)";
    }

    let cursor = 0;
    const segments = chartData.data.map((item) => {
      const start = cursor;
      const end = cursor + (item.amount / chartData.total) * 100;
      cursor = end;
      return `${item.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  }, [chartData]);

  const resetFilters = () => {
    setType(undefined);
    setFrom("");
    setTo("");
    setQ("");
    setPage(1);
  };

  const refreshAll = () => {
    void statsQuery.refetch();
    void txQuery.refetch();
  };

  const setFilterPage = () => setPage(1);
  const hasFilters = Boolean(type || from || to || q.trim());

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Doanh thu sàn</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void exportMutation.mutateAsync()}
              disabled={exportMutation.isPending}
            >
              <Download className={cn("h-4 w-4", exportMutation.isPending && "animate-pulse")} />
              Xuất CSV
            </Button>
            <Button type="button" variant="outline" onClick={refreshAll}>
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  (statsQuery.isFetching || txQuery.isFetching) && "animate-spin",
                )}
              />
              Làm mới
            </Button>
          </div>
        </header>

        <section className="rounded-lg border border-white/10 bg-card p-5 text-foreground">
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a49a88]" />
              <Input
                className="border-white/10 bg-white/5 pl-9 text-foreground placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-primary/20"
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setFilterPage();
                }}
                placeholder="Tìm source user, operation key hoặc reference"
              />
            </div>
            <Input
              type="date"
              className="border-white/10 bg-white/5 text-foreground focus-visible:border-primary/50 focus-visible:ring-primary/20"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setFilterPage();
              }}
            />
            <Input
              type="date"
              className="border-white/10 bg-white/5 text-foreground focus-visible:border-primary/50 focus-visible:ring-primary/20"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setFilterPage();
              }}
            />
            <Button type="button" variant="outline" onClick={resetFilters} disabled={!hasFilters}>
              <X className="h-4 w-4" />
              Reset
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => {
                  setType(filter.value);
                  setFilterPage();
                }}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                  type === filter.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/12 bg-white/5 text-[#d2c5b2] hover:bg-white/10 hover:text-primary",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-card p-5 text-foreground md:col-span-1">
            <Banknote className="h-6 w-6 text-primary" />
            <p className="mt-4 text-xs font-semibold uppercase text-[#a49a88]">Tổng doanh thu</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#f2eee5]">
              {formatVND(stats?.totalAmount ?? 0)}
            </p>
          </div>
          {chartData.data.map((item) => (
            <div
              key={item.type}
              className="rounded-lg border border-white/10 bg-card p-5 text-foreground"
            >
              <p className="text-xs font-semibold uppercase text-[#a49a88]">{item.label}</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-[#f2eee5]">
                {formatVND(item.amount)}
              </p>
              <p className="mt-1 text-xs text-[#a49a88]">{item.count} giao dịch</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-white/10 bg-card p-5 text-foreground">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a49a88]">
                  Revenue mix
                </p>
                <h2 className="mt-1 font-bold text-[#f2eee5]">So sánh nguồn doanh thu</h2>
              </div>
              <BarChart3 className="h-5 w-5 text-[#a49a88]" />
            </div>
            <div className="mt-6 space-y-4">
              {chartData.data.map((item) => {
                const width = chartData.hasRevenue
                  ? Math.max((item.amount / chartData.maxAmount) * 100, item.amount > 0 ? 8 : 0)
                  : 0;
                return (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{item.label}</span>
                      <span className="font-bold tabular-nums">{formatVND(item.amount)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${width}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-card p-5 text-foreground">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a49a88]">
                  Distribution
                </p>
                <h2 className="mt-1 font-bold text-[#f2eee5]">Tỷ trọng doanh thu</h2>
              </div>
              <ReceiptText className="h-5 w-5 text-[#a49a88]" />
            </div>
            <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
              <div
                className="grid size-40 place-items-center rounded-full shadow-inner"
                style={{ background: donutBackground }}
              >
                <div className="grid size-24 place-items-center rounded-full bg-card text-center">
                  <span className="text-sm font-bold text-[#f2eee5]">
                    {chartData.hasRevenue ? "Đang có dữ liệu" : "Chưa có"}
                  </span>
                </div>
              </div>
              <div className="w-full space-y-3">
                {chartData.data.map((item) => {
                  const percent = chartData.hasRevenue ? (item.amount / chartData.total) * 100 : 0;
                  return (
                    <div
                      key={item.type}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex items-center gap-2 text-[#a49a88]">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                      </span>
                      <span className="font-bold tabular-nums">{percent.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-card text-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <h2 className="font-bold text-[#f2eee5]">Giao dịch doanh thu</h2>
            <p className="text-xs font-semibold text-[#a49a88]">
              {txMeta?.total ?? 0} kết quả theo bộ lọc hiện tại
            </p>
          </div>
          {transactions.length === 0 ? (
            <AdminEmptyState
              icon={ReceiptText}
              title="Chưa có giao dịch doanh thu"
              description="Thử đổi bộ lọc hoặc kiểm tra lại sau khi phí kiểm định, hoa hồng hoặc phí cọc phạt được ghi nhận."
              action={
                <Button type="button" variant="outline" onClick={() => void txQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" />
                  Kiểm tra lại
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase text-[#a49a88]">
                  <tr>
                    <th className="px-5 py-3">Loại</th>
                    <th className="px-5 py-3">Số tiền</th>
                    <th className="px-5 py-3">Nguồn</th>
                    <th className="px-5 py-3">Operation</th>
                    <th className="px-5 py-3">Tham chiếu</th>
                    <th className="px-5 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {transactions.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-white/5">
                      <td className="px-5 py-3 font-semibold text-[#f2eee5]">
                        {TYPE_LABEL[item.type]}
                      </td>
                      <td className="px-5 py-3 font-bold tabular-nums text-[#f2eee5]">
                        {formatVND(item.amount)}
                      </td>
                      <td className="px-5 py-3 text-[#d2c5b2]">{item.sourceUserId ?? "-"}</td>
                      <td className="px-5 py-3 text-xs text-[#a49a88]">{item.operationKey}</td>
                      <td className="px-5 py-3 text-[#d2c5b2]">
                        {item.referenceType} #{item.referenceId ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-[#a49a88]">{formatDateTime(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-white/10 px-5 py-4">
                <Pagination
                  page={txMeta?.page ?? page}
                  pages={txMeta?.pages ?? 1}
                  onPage={setPage}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
