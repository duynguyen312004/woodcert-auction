import { useState } from "react";
import { Loader2, PackageCheck, RefreshCw } from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useNotification } from "@/shared/ui/notification";
import { Pagination } from "@/shared/ui/pagination";

import { useOrderMutations, useSellerOrderStatusCounts, useSellerOrders } from "../hooks/useOrders";
import type { OrderStatus, OrderSummary } from "../types";
import { OrderRow } from "./BuyerOrdersPage";

const STATUS_TABS: Array<{ label: string; status: OrderStatus | "ALL" }> = [
  { label: "Tất cả", status: "ALL" },
  { label: "Chờ giao", status: "PAID" },
  { label: "Đang giao", status: "FULFILLING" },
  { label: "Tranh chấp", status: "DISPUTED" },
  { label: "Hoàn tất", status: "COMPLETED" },
  { label: "Đã hủy", status: "CANCELED" },
];

export function SellerOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [trackingByOrder, setTrackingByOrder] = useState<Record<number, string>>({});
  const statusParam = status === "ALL" ? undefined : status;
  const ordersQuery = useSellerOrders({ page, size: 10, status: statusParam });
  const countsQuery = useSellerOrderStatusCounts();
  const mutations = useOrderMutations();
  const notification = useNotification();
  const orders = ordersQuery.data?.result ?? [];

  const countFor = (tabStatus: OrderStatus | "ALL") => {
    if (!countsQuery.data) return null;
    return tabStatus === "ALL"
      ? countsQuery.data.total
      : (countsQuery.data.byStatus[tabStatus] ?? 0);
  };

  const ship = async (order: OrderSummary) => {
    try {
      await mutations.confirmShipping.mutateAsync({
        orderId: order.id,
        trackingCode: trackingByOrder[order.id],
      });
      notification.success("Đã xác nhận giao hàng");
    } catch (error) {
      notification.error("Không thể xác nhận giao hàng", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      });
    }
  };

  return (
    <div className="flex h-full flex-col bg-warm-ivory text-[#181612]">
      <header className="sticky top-0 z-10 flex min-h-[68px] shrink-0 items-center justify-between gap-4 border-b border-[#4e4637]/20 bg-warm-ivory/85 px-8 py-3 backdrop-blur-md">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brushed-brass">
            Seller Portal
          </p>
          <h1 className="font-serif text-xl font-bold text-ink-blue">Đơn bán</h1>
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
                  setPage(1);
                }}
                className={
                  status === tab.status
                    ? "shrink-0 rounded-full border border-ink-blue bg-ink-blue px-4 py-2 text-xs font-bold text-white"
                    : "shrink-0 rounded-full border border-[#4e4637]/15 bg-white px-4 py-2 text-xs font-bold text-muted-warm"
                }
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
          <section className="grid gap-4">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                audience="seller"
                actions={
                  order.status === "PAID" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={trackingByOrder[order.id] ?? ""}
                        placeholder="Mã vận chuyển"
                        className="w-48 bg-white"
                        onChange={(event) =>
                          setTrackingByOrder((current) => ({
                            ...current,
                            [order.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={mutations.confirmShipping.isPending}
                        onClick={() => void ship(order)}
                      >
                        <PackageCheck className="h-4 w-4" />
                        Xác nhận giao
                      </Button>
                    </div>
                  ) : order.status === "DISPUTED" ? (
                    <span className="rounded-full border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                      Admin đang xử lý tranh chấp
                    </span>
                  ) : null
                }
              />
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
