import { ArrowUpRight, CalendarRange, Loader2, RefreshCw, WalletCards } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";

import { SELLER_PATHS } from "@/shared/constants/routes";
import { formatDate, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { useSellerOrders, useSellerSalesSummary } from "../hooks/useOrders";
import type { SellerSalesRange } from "../types";

const RANGES: Array<{ value: SellerSalesRange; label: string }> = [
  { value: "7D", label: "7 ngày" },
  { value: "30D", label: "30 ngày" },
  { value: "90D", label: "90 ngày" },
  { value: "ALL", label: "Toàn bộ" },
];

export function SellerRevenuePage() {
  const [range, setRange] = useState<SellerSalesRange>("30D");
  const summaryQuery = useSellerSalesSummary(range);
  const ordersQuery = useSellerOrders({ status: "COMPLETED", size: 10 });
  const summary = summaryQuery.data;
  const maxDaily = Math.max(...(summary?.daily.map((item) => item.totalRealizedIncome) ?? [0]), 1);

  return (
    <div className="flex h-full flex-col bg-warm-ivory">
      <header className="sticky top-0 z-10 flex min-h-[68px] items-center justify-between border-b border-[#4e4637]/20 bg-warm-ivory/85 px-8 backdrop-blur-md">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brushed-brass">
            Seller Portal
          </p>
          <h1 className="font-sans text-xl font-bold text-ink-blue">Doanh thu đã đối soát</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void summaryQuery.refetch();
            void ordersQuery.refetch();
          }}
        >
          <RefreshCw
            className={cn(
              "size-4",
              (summaryQuery.isFetching || ordersQuery.isFetching) && "animate-spin",
            )}
          />
          Làm mới
        </Button>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 space-y-6 overflow-y-auto p-8">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRange(item.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                range === item.value
                  ? "border-ink-blue bg-ink-blue text-white"
                  : "border-[#4e4637]/15 bg-white text-muted-warm hover:border-brushed-brass/40",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {summaryQuery.isPending ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="size-7 animate-spin text-brushed-brass" />
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <RevenueCard label="Tổng giá trị bán" value={summary?.grossSales ?? 0} />
              <RevenueCard label="Phí nền tảng" value={summary?.platformCommission ?? 0} muted />
              <RevenueCard label="Thực nhận tiền hàng" value={summary?.sellerPayout ?? 0} />
              <RevenueCard
                label="Tổng thu nhập thực tế"
                value={summary?.totalRealizedIncome ?? 0}
                featured
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="rounded-xl border border-[#4e4637]/15 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-sans text-lg font-bold text-ink-blue">
                      Doanh thu theo ngày
                    </h2>
                    <p className="mt-1 text-sm text-muted-warm">Chỉ gồm các khoản đã ghi nhận.</p>
                  </div>
                  <CalendarRange className="size-5 text-brushed-brass" />
                </div>
                {summary?.daily.length ? (
                  <div className="mt-8 flex h-56 items-end gap-2 overflow-x-auto border-b border-[#4e4637]/15 pb-1">
                    {summary.daily.map((item) => (
                      <div
                        key={item.date}
                        className="group flex min-w-10 flex-1 flex-col items-center justify-end gap-2"
                        title={`${formatDate(item.date)}: ${formatVND(item.totalRealizedIncome)}`}
                      >
                        <div
                          className="w-full max-w-12 rounded-t bg-ink-blue transition-colors group-hover:bg-brushed-brass"
                          style={{
                            height: `${Math.max(6, (item.totalRealizedIncome / maxDaily) * 180)}px`,
                          }}
                        />
                        <span className="text-[9px] font-semibold text-muted-warm">
                          {item.date.slice(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-lg bg-[#F6F0E6] p-10 text-center text-sm text-muted-warm">
                    Chưa có doanh thu trong khoảng này.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-ink-blue/15 bg-ink-blue p-6 text-white shadow-sm">
                <WalletCards className="size-7 text-brushed-brass" />
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#d2c5b2]">
                  Thu từ cọc bị tịch thu
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatVND(summary?.forfeitedDepositIncome ?? 0)}
                </p>
                <p className="mt-6 text-sm leading-relaxed text-[#d2c5b2]">
                  {summary?.completedOrders ?? 0} đơn đã hoàn tất.
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-[#4e4637]/15 bg-white shadow-sm">
              <div className="border-b border-[#4e4637]/10 px-6 py-5">
                <h2 className="font-sans text-lg font-bold text-ink-blue">
                  Đơn đã hoàn tất gần đây
                </h2>
              </div>
              <div className="divide-y divide-[#4e4637]/10">
                {(ordersQuery.data?.result ?? []).map((order) => (
                  <Link
                    key={order.id}
                    to={SELLER_PATHS.orderDetail(order.id)}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-[#F6F0E6]/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink-blue">
                        {order.product?.title ?? `Đơn #${order.id}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-warm">
                        Hoàn tất {formatDate(order.completedAt ?? undefined)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-verdigris">
                        {formatVND(
                          (order.sellerPayoutAmount ?? 0) +
                            (order.forfeitedDepositSellerAmount ?? 0),
                        )}
                      </span>
                      <ArrowUpRight className="size-4 text-muted-warm" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function RevenueCard({
  label,
  value,
  muted,
  featured,
}: {
  label: string;
  value: number;
  muted?: boolean;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 shadow-sm",
        featured
          ? "border-brushed-brass bg-brushed-brass text-[#181612]"
          : "border-[#4e4637]/15 bg-white",
      )}
    >
      <p
        className={cn(
          "text-xs font-bold uppercase tracking-wider",
          featured ? "text-[#4e4637]" : "text-muted-warm",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-2xl font-bold",
          muted ? "text-terracotta" : featured ? "text-[#181612]" : "text-ink-blue",
        )}
      >
        {formatVND(value)}
      </p>
    </div>
  );
}
