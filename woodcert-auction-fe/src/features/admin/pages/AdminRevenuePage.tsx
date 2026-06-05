import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, BarChart3, ReceiptText, RefreshCw } from "lucide-react";

import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Pagination } from "@/shared/ui/pagination";

import { revenueApi, type PlatformRevenueType } from "../api/revenue";
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

export function AdminRevenuePage() {
  const [page, setPage] = useState(1);
  const statsQuery = useQuery({
    queryKey: ["admin", "revenue", "stats"],
    queryFn: revenueApi.getStats,
  });
  const txQuery = useQuery({
    queryKey: ["admin", "revenue", "transactions", page],
    queryFn: () => revenueApi.getTransactions(page),
  });

  const stats = statsQuery.data;
  const transactions = txQuery.data?.result ?? [];
  const txMeta = txQuery.data?.meta;

  const chartData = useMemo(() => {
    const data = (Object.keys(TYPE_LABEL) as PlatformRevenueType[]).map((type) => ({
      type,
      label: TYPE_LABEL[type],
      amount: stats?.byType?.[type]?.amount ?? 0,
      count: stats?.byType?.[type]?.count ?? 0,
      color: TYPE_COLOR[type],
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

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Doanh thu sàn</h1>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void statsQuery.refetch();
              void txQuery.refetch();
            }}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                (statsQuery.isFetching || txQuery.isFetching) && "animate-spin",
              )}
            />
            Làm mới
          </Button>
        </header>

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
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="font-bold text-[#f2eee5]">Giao dịch doanh thu gần đây</h2>
          </div>
          {transactions.length === 0 ? (
            <AdminEmptyState
              icon={ReceiptText}
              title="Chưa có giao dịch doanh thu"
              description="Khi phí kiểm định, hoa hồng hoặc phí cọc phạt được ghi nhận, giao dịch mới sẽ xuất hiện tại đây."
              action={
                <Button type="button" variant="outline" onClick={() => void txQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" />
                  Kiểm tra lại
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase text-[#a49a88]">
                  <tr>
                    <th className="px-5 py-3">Loại</th>
                    <th className="px-5 py-3">Số tiền</th>
                    <th className="px-5 py-3">Nguồn</th>
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
