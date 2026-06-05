import { useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, FileUp, Loader2, RefreshCw } from "lucide-react";

import { disputeApi, useOpenDispute } from "@/features/dispute";
import { isApiError } from "@/shared/api/errors";
import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useNotification } from "@/shared/ui/notification";
import { Pagination } from "@/shared/ui/pagination";

import { getOrderStatusText, OrderFeeBreakdown } from "../components/OrderFeeBreakdown";
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
    <main className="min-h-screen bg-[#181612] px-4 py-8 text-[#f2eee5] sm:px-6 lg:px-10">
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
                actions={
                  <>
                    {order.status === "PENDING_PAYMENT" && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={mutations.payRemainder.isPending}
                        onClick={() =>
                          void runAction(
                            () => mutations.payRemainder.mutateAsync(order.id),
                            "Đã thanh toán phần còn lại.",
                          )
                        }
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
    </main>
  );
}

export function OrderRow({
  order,
  audience,
  actions,
}: {
  order: OrderSummary;
  audience: "buyer" | "seller";
  actions?: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#f2eee5] p-5 text-stone-950 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">Đơn #{order.id}</h2>
            <span className="rounded-full border border-stone-300 px-2.5 py-1 text-xs font-bold text-stone-600">
              {getOrderStatusText(order.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Phiên #{order.sourceId} · tạo lúc{" "}
            {order.createdAt ? formatDateTime(order.createdAt) : "—"}
          </p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <OrderFeeBreakdown
          order={order}
          audience={audience}
          showStatus
          lineClassName="border-stone-300"
        />
        <div className="rounded-md border border-stone-300 bg-[#e9e2d6] p-4 text-sm">
          <p className="font-bold">Vận chuyển</p>
          <p className="mt-2 text-stone-600">
            Trạng thái: {order.fulfillment?.status ?? "Chưa tạo"}
          </p>
          <p className="mt-1 text-stone-600">
            Mã vận chuyển: {order.fulfillment?.trackingCode ?? "—"}
          </p>
        </div>
      </div>
    </article>
  );
}

function OpenDisputeDialog({
  order,
  onOpenChange,
}: {
  order: OrderSummary | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setUploading] = useState(false);
  const openDispute = useOpenDispute();
  const notification = useNotification();

  const submit = async () => {
    if (!order) return;
    if (!reason.trim() || files.length === 0) {
      notification.error("Thiếu thông tin tranh chấp", {
        description: "Vui lòng nhập lý do và đính kèm ít nhất một ảnh bằng chứng.",
      });
      return;
    }
    setUploading(true);
    try {
      const mediaIds = [];
      for (const file of files) {
        mediaIds.push(await disputeApi.uploadEvidence(file));
      }
      await openDispute.mutateAsync({
        orderId: order.id,
        payload: {
          reason: reason.trim(),
          description: description.trim() || undefined,
          evidenceMediaIds: mediaIds,
        },
      });
      notification.success("Đã mở tranh chấp");
      setReason("");
      setDescription("");
      setFiles([]);
      onOpenChange(false);
    } catch (error) {
      notification.error("Không thể mở tranh chấp", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#f2eee5] text-stone-950">
        <DialogHeader>
          <DialogTitle>Mở tranh chấp đơn #{order?.id}</DialogTitle>
          <DialogDescription>
            Tranh chấp sẽ tạm giữ payout cho seller cho đến khi admin xử lý.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dispute-reason">Lý do</Label>
            <Input id="dispute-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dispute-desc">Mô tả</Label>
            <textarea
              id="dispute-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 min-h-24 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <Label htmlFor="dispute-files">Ảnh bằng chứng</Label>
            <Input
              id="dispute-files"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 10))}
            />
            <p className="mt-1 text-xs text-stone-500">{files.length} file đã chọn</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isUploading || openDispute.isPending}
            onClick={() => void submit()}
          >
            {isUploading || openDispute.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            Gửi tranh chấp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
