import { useState } from "react";
import { Eye, Loader2, RefreshCw, Truck } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { SELLER_PATHS } from "@/shared/constants/routes";
import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Pagination } from "@/shared/ui/pagination";

import { useSellerOrderStatusCounts, useSellerOrders } from "../hooks/useOrders";
import { getFulfillmentStatusText, getOrderStatusText } from "../lib/order-labels";
import type { OrderStatus, OrderSummary } from "../types";

const STATUS_TABS: Array<{ label: string; status: OrderStatus | "ALL" }> = [
  { label: "Tất cả", status: "ALL" },
  { label: "Chờ giao", status: "PAID" },
  { label: "Đang giao", status: "FULFILLING" },
  { label: "Tranh chấp", status: "DISPUTED" },
  { label: "Hoàn tất", status: "COMPLETED" },
  { label: "Đã hủy", status: "CANCELED" },
];

export function SellerOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const [status, setStatus] = useState<OrderStatus | "ALL">(
    STATUS_TABS.some((tab) => tab.status === requestedStatus)
      ? (requestedStatus as OrderStatus)
      : "ALL",
  );
  const [page, setPage] = useState(1);
  const statusParam = status === "ALL" ? undefined : status;
  const ordersQuery = useSellerOrders({ page, size: 10, status: statusParam });
  const countsQuery = useSellerOrderStatusCounts();
  const orders = ordersQuery.data?.result ?? [];

  const countFor = (tabStatus: OrderStatus | "ALL") => {
    if (!countsQuery.data) return null;
    return tabStatus === "ALL"
      ? countsQuery.data.total
      : (countsQuery.data.byStatus[tabStatus] ?? 0);
  };

  return (
    <div className="flex h-full flex-col bg-warm-ivory text-[#181612]">
      <header className="sticky top-0 z-10 flex min-h-[68px] shrink-0 items-center justify-between gap-4 border-b border-[#4e4637]/20 bg-warm-ivory/85 px-8 py-3 backdrop-blur-md">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brushed-brass">
            Seller Portal
          </p>
          <h1 className="font-sans text-xl font-bold text-ink-blue">Đơn bán</h1>
        </div>
        <Button type="button" variant="outline" onClick={() => void ordersQuery.refetch()}>
          <RefreshCw className={ordersQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Làm mới
        </Button>
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 space-y-6 overflow-y-auto p-8">
        <div className="flex gap-2 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count = countFor(tab.status);
            return (
              <button
                key={tab.status}
                type="button"
                onClick={() => {
                  setStatus(tab.status);
                  setSearchParams(tab.status === "ALL" ? {} : { status: tab.status });
                  setPage(1);
                }}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                  status === tab.status
                    ? "border-ink-blue bg-ink-blue text-white"
                    : "border-[#4e4637]/15 bg-white text-muted-warm hover:border-brushed-brass/40 hover:text-ink-blue",
                )}
              >
                {tab.label}
                {count !== null ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>

        {ordersQuery.isPending ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brushed-brass" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-[#4e4637]/15 bg-white p-10 text-center text-muted-warm">
            Chưa có đơn bán phù hợp.
          </div>
        ) : (
          <section className="grid gap-3">
            {orders.map((order) => (
              <SellerOrderListItem key={order.id} order={order} />
            ))}
          </section>
        )}

        <Pagination
          page={ordersQuery.data?.meta.page ?? page}
          pages={ordersQuery.data?.meta.pages ?? 1}
          onPage={setPage}
        />
      </main>
    </div>
  );
}

function SellerOrderListItem({ order }: { order: OrderSummary }) {
  return (
    <article className="rounded-lg border border-[#4e4637]/15 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="size-16 shrink-0 overflow-hidden rounded-md border border-[#4e4637]/15 bg-[#eae1d6]">
            {order.product?.imageUrl ? (
              <img
                src={order.product.imageUrl}
                alt={order.product.title ?? `Đơn #${order.id}`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-warm">
                <Truck className="size-6" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-sans text-lg font-bold text-ink-blue">Đơn #{order.id}</h2>
              <span className="rounded-full border border-brushed-brass/25 bg-brushed-brass/10 px-2.5 py-1 text-xs font-bold text-brushed-brass">
                {getOrderStatusText(order.status)}
              </span>
              {order.status === "DISPUTED" && (
                <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                  Admin đang xử lý
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-[#4e4637]">
              {order.product?.title ?? `Sản phẩm #${order.id}`}
            </p>
            <p className="mt-1 text-xs text-muted-warm">
              Phiên #{order.sourceId} · tạo lúc {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm md:min-w-[360px] md:grid-cols-[1fr_1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold text-muted-warm">Giá chốt</p>
            <p className="mt-1 font-bold tabular-nums text-ink-blue">
              {formatVND(order.finalPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-warm">Vận chuyển</p>
            <p className="mt-1 font-bold text-ink-blue">
              {getFulfillmentStatusText(order.fulfillment?.status)}
            </p>
          </div>
          <Button asChild type="button" size="sm" variant="outline">
            <Link to={SELLER_PATHS.orderDetail(order.id)}>
              <Eye className="h-4 w-4" />
              Chi tiết
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
