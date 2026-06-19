import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  PackageSearch,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Truck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useParams } from "react-router";

import {
  useCancelDispute,
  useCurrentDispute,
  useDisputeHistory,
  type DisputeCase,
} from "@/features/dispute";
import { isApiError } from "@/shared/api/errors";
import { BUYER_PATHS } from "@/shared/constants/routes";
import { formatDateTime, formatVND } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";

import { DisputeHistoryPanel } from "../components/DisputeHistoryPanel";
import { OpenDisputeDialog } from "../components/OpenDisputeDialog";
import { OrderFeeBreakdown } from "../components/OrderFeeBreakdown";
import { PaymentAddressDialog } from "../components/PaymentAddressDialog";
import { useOrderDetail, useOrderMutations } from "../hooks/useOrders";
import {
  getCancelReasonText,
  getDeliveryMethodText,
  getFulfillmentStatusText,
  getOrderStatusText,
} from "../lib/order-labels";
import type { OrderDetail } from "../types";

function parseId(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function BuyerOrderDetailPage() {
  const orderId = parseId(useParams<{ orderId: string }>().orderId);
  const orderQuery = useOrderDetail(orderId);
  const currentDisputeQuery = useCurrentDispute(orderId);
  const disputeHistoryQuery = useDisputeHistory(orderId);
  const cancelDispute = useCancelDispute();
  const mutations = useOrderMutations();
  const notification = useNotification();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const order = orderQuery.data;
  const currentDispute = currentDisputeQuery.data ?? null;

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      notification.success(success);
      void orderQuery.refetch();
    } catch (error) {
      notification.error("Không thể thực hiện thao tác", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      });
    }
  };

  if (!orderId || orderQuery.isError) {
    return <State title="Không tìm thấy đơn mua này" />;
  }

  if (orderQuery.isPending || !order) {
    return <State title="Đang tải chi tiết đơn" loading />;
  }

  return (
    <main className="buyer-portal min-h-screen bg-[#181612] px-4 py-8 text-[#f2eee5] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Button asChild type="button" variant="outline" size="sm" className="mb-4">
              <Link to={BUYER_PATHS.orders}>
                <ArrowLeft className="h-4 w-4" />
                Quay lại đơn mua
              </Link>
            </Button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Order #{order.id}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {order.product?.title ?? `Sản phẩm #${order.productId}`}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#d2c5b2]">
              Trạng thái {getOrderStatusText(order.status)} · tạo lúc{" "}
              {formatDateTime(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void orderQuery.refetch()}>
              <RefreshCw className={orderQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Làm mới
            </Button>
            <OrderActions
              order={order}
              currentDispute={currentDispute}
              isPaying={mutations.payRemainder.isPending}
              isReceiving={mutations.confirmReceived.isPending}
              isCancelingDispute={cancelDispute.isPending}
              onPay={() => setPaymentOpen(true)}
              onReceive={() =>
                void runAction(
                  () => mutations.confirmReceived.mutateAsync(order.id),
                  "Đã xác nhận nhận hàng.",
                )
              }
              onOpenDispute={() => setDisputeOpen(true)}
              onCancelDispute={(disputeId) =>
                void runAction(
                  () => cancelDispute.mutateAsync({ orderId: order.id, disputeId }),
                  "Đã hủy tranh chấp.",
                )
              }
            />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <ProductPanel order={order} />
          <div className="grid gap-6">
            <Panel title="Dòng tiền escrow" icon={<CreditCard />}>
              <OrderFeeBreakdown
                order={order}
                audience="buyer"
                showStatus
                lineClassName="border-stone-300"
                labelClassName="text-stone-600"
                valueClassName="text-stone-950"
              />
              {order.cancelReason && (
                <p className="mt-3 rounded-md border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm font-semibold text-terracotta">
                  {getCancelReasonText(order.cancelReason)}
                </p>
              )}
            </Panel>

            <Panel title="Vận chuyển" icon={<Truck />}>
              <div className="grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
                <Info
                  label="Trạng thái"
                  value={getFulfillmentStatusText(order.fulfillment?.status)}
                />
                <Info
                  label="Hình thức"
                  value={getDeliveryMethodText(order.fulfillment?.deliveryMethod)}
                />
                <Info label="Đơn vị" value={order.fulfillment?.carrierName ?? "—"} />
                <Info label="Mã vận đơn" value={order.fulfillment?.trackingCode ?? "—"} />
                <Info
                  label="Bắt đầu giao"
                  value={formatOptionalDate(order.fulfillment?.shippedAt)}
                />
                <Info
                  label="Hạn Seller giao hàng"
                  value={formatOptionalDate(order.fulfillment?.shipmentDeadline)}
                />
                <Info
                  label="Tự hoàn tất"
                  value={formatOptionalDate(order.fulfillment?.autoCompleteDeadline)}
                />
              </div>
              {order.shippingAddress && (
                <p className="mt-4 border-t border-stone-300 pt-4 text-sm leading-relaxed text-stone-700">
                  {[order.shippingAddress.receiverName, order.shippingAddress.phoneNumber].join(
                    " · ",
                  )}
                  <br />
                  {[
                    order.shippingAddress.streetAddress,
                    order.shippingAddress.wardName,
                    order.shippingAddress.districtName,
                    order.shippingAddress.provinceName,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </Panel>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Panel title="Timeline" icon={<RotateCcw />}>
            <Timeline label="Tạo đơn" value={order.createdAt} />
            <Timeline label="Thanh toán" value={order.paidAt} />
            <Timeline label="Giao hàng" value={order.fulfillment?.shippedAt} />
            <Timeline label="Hoàn tiền" value={order.refundedAt} />
            <Timeline label="Hoàn tất" value={order.completedAt} />
            <Timeline label="Hủy đơn" value={order.canceledAt} />
          </Panel>

          <Panel title="Tranh chấp" icon={<ShieldAlert />}>
            {currentDispute && <CurrentDisputeBanner dispute={currentDispute} />}
            <DisputeHistoryPanel
              disputes={disputeHistoryQuery.data ?? []}
              isLoading={disputeHistoryQuery.isPending}
              getDetailPath={(dispute) => BUYER_PATHS.disputeDetail(order.id, dispute.id)}
            />
          </Panel>
        </section>
      </div>

      <PaymentAddressDialog
        order={paymentOpen ? order : null}
        isPending={mutations.payRemainder.isPending}
        onOpenChange={setPaymentOpen}
        onConfirm={async (addressId) => {
          await runAction(
            () => mutations.payRemainder.mutateAsync({ orderId: order.id, addressId }),
            "Đã xác nhận thanh toán và địa chỉ nhận hàng.",
          );
          setPaymentOpen(false);
        }}
      />
      <OpenDisputeDialog order={disputeOpen ? order : null} onOpenChange={setDisputeOpen} />
    </main>
  );
}

function OrderActions({
  order,
  currentDispute,
  isPaying,
  isReceiving,
  isCancelingDispute,
  onPay,
  onReceive,
  onOpenDispute,
  onCancelDispute,
}: {
  order: OrderDetail;
  currentDispute: DisputeCase | null;
  isPaying: boolean;
  isReceiving: boolean;
  isCancelingDispute: boolean;
  onPay: () => void;
  onReceive: () => void;
  onOpenDispute: () => void;
  onCancelDispute: (disputeId: number) => void;
}) {
  const canCancelDispute =
    currentDispute?.status === "OPEN" || currentDispute?.status === "UNDER_REVIEW";

  return (
    <>
      {order.status === "PENDING_PAYMENT" && (
        <Button type="button" disabled={isPaying} onClick={onPay}>
          <CreditCard className="h-4 w-4" />
          Thanh toán {formatVND(order.remainingAmount)}
        </Button>
      )}
      {order.status === "FULFILLING" && order.fulfillment?.status === "SHIPPED" && (
        <>
          <Button type="button" disabled={isReceiving} onClick={onReceive}>
            <CheckCircle2 className="h-4 w-4" />
            Đã nhận hàng
          </Button>
          <Button type="button" variant="outline" onClick={onOpenDispute}>
            <AlertTriangle className="h-4 w-4" />
            Mở tranh chấp
          </Button>
        </>
      )}
      {canCancelDispute && currentDispute && (
        <Button
          type="button"
          variant="outline"
          disabled={isCancelingDispute}
          onClick={() => onCancelDispute(currentDispute.id)}
        >
          <ShieldAlert className="h-4 w-4" />
          Hủy tranh chấp
        </Button>
      )}
    </>
  );
}

function ProductPanel({ order }: { order: OrderDetail }) {
  return (
    <section className="light-panel overflow-hidden rounded-lg border border-white/10 bg-[#f2eee5] text-stone-950 shadow-sm">
      <div className="aspect-square bg-stone-200">
        {order.product?.imageUrl ? (
          <img
            src={order.product.imageUrl}
            alt={order.product.title ?? ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            <PackageSearch className="h-12 w-12" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-5">
        <span className="rounded-full border border-stone-300 px-3 py-1 text-xs font-bold text-stone-600">
          {getOrderStatusText(order.status)}
        </span>
        <h2 className="text-xl font-bold">
          {order.product?.title ?? `Sản phẩm #${order.productId}`}
        </h2>
        <p className="text-sm text-stone-600">Phiên đấu giá #{order.sourceId}</p>
      </div>
    </section>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="light-panel rounded-lg border border-white/10 bg-[#f2eee5] p-5 text-stone-950 shadow-sm">
      <div className="mb-4 flex items-center gap-2 border-b border-stone-300 pb-3">
        <span className="text-brushed-brass [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-300 bg-[#e9e2d6] px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function Timeline({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 border-l border-brushed-brass/30 pb-5 pl-4 last:pb-0">
      <div className="-ml-[21px] mt-1 h-2 w-2 rounded-full bg-brushed-brass" />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{label}</p>
        <p className="mt-1 text-sm font-semibold text-stone-900">{formatDateTime(value)}</p>
      </div>
    </div>
  );
}

function CurrentDisputeBanner({ dispute }: { dispute: DisputeCase }) {
  return (
    <div className="mb-4 rounded-md border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
      <p className="font-bold">Đang có tranh chấp #{dispute.id}</p>
      <p className="mt-1">{dispute.reason}</p>
    </div>
  );
}

function State({ title, loading }: { title: string; loading?: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#181612] px-4 text-[#f2eee5]">
      <div className="text-center">
        {loading ? (
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
        ) : (
          <PackageSearch className="mx-auto h-8 w-8 text-primary" />
        )}
        <p className="mt-4 font-bold">{title}</p>
        {!loading && (
          <Button asChild type="button" variant="outline" className="mt-5">
            <Link to={BUYER_PATHS.orders}>Quay lại đơn mua</Link>
          </Button>
        )}
      </div>
    </main>
  );
}

function formatOptionalDate(value: string | null | undefined) {
  return value ? formatDateTime(value) : "—";
}
