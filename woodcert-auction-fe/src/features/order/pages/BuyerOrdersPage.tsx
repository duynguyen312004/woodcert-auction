import { useState } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, RefreshCw } from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { BUYER_PATHS } from "@/shared/constants/routes";
import { formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";
import { Pagination } from "@/shared/ui/pagination";

import { OpenDisputeDialog } from "../components/OpenDisputeDialog";
import { OrderRow } from "../components/OrderRow";
import { PaymentAddressDialog } from "../components/PaymentAddressDialog";
import { useBuyerOrderStatusCounts, useBuyerOrders, useOrderMutations } from "../hooks/useOrders";
import type { OrderStatus, OrderSummary } from "../types";

const STATUS_TABS: Array<{ label: string; status: OrderStatus | "ALL" }> = [
  { label: "Tất cả", status: "ALL" },
  { label: "Chờ thanh toán", status: "PENDING_PAYMENT" },
  { label: "Đang giao", status: "FULFILLING" },
  { label: "Tranh chấp", status: "DISPUTED" },
  { label: "Hoàn tất", status: "COMPLETED" },
  { label: "Đã hủy", status: "CANCELED" },
];

export function BuyerOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [disputeOrder, setDisputeOrder] = useState<OrderSummary | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<OrderSummary | null>(null);
  const statusParam = status === "ALL" ? undefined : status;
  const ordersQuery = useBuyerOrders({ page, size: 10, status: statusParam });
  const countsQuery = useBuyerOrderStatusCounts();
  const mutations = useOrderMutations();
  const notification = useNotification();
  const orders = ordersQuery.data?.result ?? [];

  const countFor = (tabStatus: OrderStatus | "ALL") => {
    if (!countsQuery.data) return null;
    return tabStatus === "ALL"
      ? countsQuery.data.total
      : (countsQuery.data.byStatus[tabStatus] ?? 0);
  };

  async function runAction(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      notification.success(success);
    } catch (error) {
      notification.error("Không thể thực hiện thao tác", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      });
    }
  }

  return (
    <main className="buyer-portal min-h-screen bg-[#181612] px-4 py-8 text-[#f2eee5] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Buyer</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Đơn mua</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#d2c5b2]">
              Theo dõi thanh toán, vận chuyển và xử lý tranh chấp sau phiên đấu giá.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void ordersQuery.refetch()}>
            <RefreshCw className={cn("h-4 w-4", ordersQuery.isFetching && "animate-spin")} />
            Làm mới
          </Button>
        </header>

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
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                  status === tab.status
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/12 bg-white/5 text-[#d2c5b2] hover:border-primary/40",
                )}
              >
                {tab.label}
                {count !== null ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>

        <section className="grid gap-4">
          {ordersQuery.isPending ? (
            <LoadingState />
          ) : orders.length === 0 ? (
            <EmptyState />
          ) : (
            orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                audience="buyer"
                detailTo={BUYER_PATHS.orderDetail(order.id)}
                actions={
                  <>
                    {order.status === "PENDING_PAYMENT" && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={mutations.payRemainder.isPending}
                        onClick={() => setPaymentOrder(order)}
                      >
                        <CreditCard className="h-4 w-4" />
                        Thanh toán {formatVND(order.remainingAmount)}
                      </Button>
                    )}
                    {order.status === "FULFILLING" && order.fulfillment?.status === "SHIPPED" && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={mutations.confirmReceived.isPending}
                          onClick={() =>
                            void runAction(
                              () => mutations.confirmReceived.mutateAsync(order.id),
                              "Đã xác nhận nhận hàng.",
                            )
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Đã nhận hàng
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setDisputeOrder(order)}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Mở tranh chấp
                        </Button>
                      </>
                    )}
                  </>
                }
              />
            ))
          )}
        </section>

        <Pagination
          page={ordersQuery.data?.meta.page ?? page}
          pages={ordersQuery.data?.meta.pages ?? 1}
          onPage={setPage}
        />
      </div>

      <OpenDisputeDialog
        order={disputeOrder}
        onOpenChange={(open) => !open && setDisputeOrder(null)}
      />
      <PaymentAddressDialog
        order={paymentOrder}
        isPending={mutations.payRemainder.isPending}
        onOpenChange={(open) => !open && setPaymentOrder(null)}
        onConfirm={async (addressId) => {
          if (!paymentOrder) return;
          await runAction(
            () =>
              mutations.payRemainder.mutateAsync({
                orderId: paymentOrder.id,
                addressId,
              }),
            "Đã xác nhận thanh toán và địa chỉ nhận hàng.",
          );
          setPaymentOrder(null);
        }}
      />
    </main>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-48 items-center justify-center text-[#d2c5b2]">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-10 text-center text-[#d2c5b2]">
      Chưa có đơn hàng phù hợp.
    </div>
  );
}
