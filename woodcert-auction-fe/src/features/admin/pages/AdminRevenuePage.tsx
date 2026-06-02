import { useQuery } from "@tanstack/react-query";
import { Banknote, RefreshCw } from "lucide-react";

import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { revenueApi, type PlatformRevenueType } from "../api/revenue";

const TYPE_LABEL: Record<PlatformRevenueType, string> = {
  APPRAISAL_FEE: "Phí kiểm định",
  SALE_COMMISSION: "Hoa hồng bán",
  FORFEITED_DEPOSIT_FEE: "Phí cọc phạt",
};

export function AdminRevenuePage() {
  const statsQuery = useQuery({
    queryKey: ["admin", "revenue", "stats"],
    queryFn: revenueApi.getStats,
  });
  const txQuery = useQuery({
    queryKey: ["admin", "revenue", "transactions"],
    queryFn: revenueApi.getTransactions,
  });

  const stats = statsQuery.data;
  const transactions = txQuery.data?.result ?? [];

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex items-end justify-between gap-4">
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
          <div className="rounded-lg border border-white/10 bg-[#f2eee5] p-5 text-stone-950 md:col-span-1">
            <Banknote className="h-6 w-6 text-primary" />
            <p className="mt-4 text-xs font-semibold uppercase text-stone-500">Tổng doanh thu</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {formatVND(stats?.totalAmount ?? 0)}
            </p>
          </div>
          {(Object.keys(TYPE_LABEL) as PlatformRevenueType[]).map((type) => (
            <div
              key={type}
              className="rounded-lg border border-white/10 bg-[#f2eee5] p-5 text-stone-950"
            >
              <p className="text-xs font-semibold uppercase text-stone-500">{TYPE_LABEL[type]}</p>
              <p className="mt-2 text-xl font-bold tabular-nums">
                {formatVND(stats?.byType?.[type]?.amount ?? 0)}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {stats?.byType?.[type]?.count ?? 0} giao dịch
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#f2eee5] text-stone-950">
          <div className="border-b border-stone-300 px-5 py-4">
            <h2 className="font-bold">Giao dịch doanh thu gần đây</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#e9e2d6] text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-5 py-3">Loại</th>
                  <th className="px-5 py-3">Số tiền</th>
                  <th className="px-5 py-3">Nguồn</th>
                  <th className="px-5 py-3">Tham chiếu</th>
                  <th className="px-5 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-300">
                {transactions.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 font-semibold">{TYPE_LABEL[item.type]}</td>
                    <td className="px-5 py-3 font-bold tabular-nums">{formatVND(item.amount)}</td>
                    <td className="px-5 py-3">{item.sourceUserId ?? "—"}</td>
                    <td className="px-5 py-3">
                      {item.referenceType} #{item.referenceId ?? "—"}
                    </td>
                    <td className="px-5 py-3">{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td className="px-5 py-10 text-center text-stone-500" colSpan={5}>
                      Chưa có giao dịch doanh thu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
