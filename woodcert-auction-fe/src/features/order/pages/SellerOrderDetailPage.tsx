import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  RefreshCw,
  ShieldAlert,
  Truck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";

import { useDisputeHistory } from "@/features/dispute";
import { isApiError } from "@/shared/api/errors";
import { SELLER_PATHS } from "@/shared/constants/routes";
import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";

import { OrderFeeBreakdown } from "../components/OrderFeeBreakdown";
import { DisputeHistoryPanel } from "../components/DisputeHistoryPanel";
import { ShippingConfirmationForm } from "../components/ShippingConfirmationForm";
import { useOrderDetail, useOrderMutations } from "../hooks/useOrders";
import {
  getCancelReasonText,
  getDeliveryMethodText,
  getFulfillmentStatusText,
  getOrderStatusText,
} from "../lib/order-labels";
import type { ConfirmShippingPayload, OrderBuyerSummary, OrderShippingAddress } from "../types";

function parseId(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function SellerOrderDetailPage() {
  const orderId = parseId(useParams<{ orderId: string }>().orderId);
  const orderQuery = useOrderDetail(orderId);
  const disputeQuery = useDisputeHistory(orderId);
  const mutations = useOrderMutations();
  const notification = useNotification();
  const order = orderQuery.data;

  const ship = async (payload: ConfirmShippingPayload) => {
    if (!order) return;
    try {
      await mutations.confirmShipping.mutateAsync({
        orderId: order.id,
        payload,
      });
      notification.success("Đã xác nhận giao hàng");
      void orderQuery.refetch();
    } catch (error) {
      notification.error("Không thể xác nhận giao hàng", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      });
      throw error;
    }
  };

  if (!orderId || orderQuery.isError) {
    return <OrderState title="Không tìm thấy đơn bán này" />;
  }
  if (orderQuery.isPending || !order) {
    return <OrderState title="Đang tải chi tiết đơn" loading />;
  }

  return (
    <div className="flex h-full flex-col bg-warm-ivory">
      <header className="sticky top-0 z-10 flex min-h-[68px] items-center justify-between border-b border-[#4e4637]/20 bg-warm-ivory/85 px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            to={SELLER_PATHS.orders}
            className="flex size-9 items-center justify-center rounded-lg border border-[#4e4637]/15 bg-white text-muted-warm transition-all duration-300 hover:border-brushed-brass/50 hover:bg-brushed-brass/10 hover:text-brushed-brass active:scale-95"
            title="Quay lại danh sách đơn bán"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-sans text-xl font-bold text-ink-blue">Đơn #{order.id}</h1>
        </div>
        <Button type="button" variant="outline" onClick={() => void orderQuery.refetch()}>
          <RefreshCw className={orderQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
          Làm mới
        </Button>
      </header>

      <main className="mx-auto grid w-full max-w-[1280px] flex-1 gap-6 overflow-y-auto p-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-[#4e4637]/15 bg-white shadow-sm">
            <div className="flex gap-5 p-6">
              <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-[#eae1d6]">
                {order.product?.imageUrl ? (
                  <img
                    src={order.product.imageUrl}
                    alt={order.product.title ?? `Sản phẩm #${order.productId}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ReceiptText className="size-7 text-muted-warm" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="rounded-full border border-brushed-brass/30 bg-brushed-brass/10 px-3 py-1 text-xs font-bold text-brushed-brass">
                  {getOrderStatusText(order.status)}
                </span>
                <h2 className="mt-3 font-sans text-xl font-bold text-ink-blue">
                  {order.product?.title ?? `Sản phẩm #${order.productId}`}
                </h2>
                <p className="mt-1 text-sm text-muted-warm">Phiên đấu giá #{order.sourceId}</p>
              </div>
            </div>
          </section>

          <BuyerPanel buyer={order.buyer} />
          <ReceiverPanel address={order.shippingAddress ?? null} />

          <Panel title="Dòng thời gian" icon={<CalendarClock />}>
            <Timeline label="Tạo đơn" value={order.createdAt} />
            <Timeline label="Thanh toán" value={order.paidAt} />
            <Timeline label="Bắt đầu giao" value={order.fulfillment?.shippedAt} />
            <Timeline label="Người mua nhận hàng" value={order.fulfillment?.receivedAt} />
            <Timeline label="Hoàn tất" value={order.completedAt} />
            <Timeline label="Hủy đơn" value={order.canceledAt} />
          </Panel>

          <Panel title="Lịch sử tranh chấp" icon={<ShieldAlert />}>
            <DisputeHistoryPanel
              disputes={disputeQuery.data ?? []}
              isLoading={disputeQuery.isPending}
              getDetailPath={(dispute) => SELLER_PATHS.disputeDetail(order.id, dispute.id)}
            />
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Tài chính đơn hàng" icon={<ReceiptText />}>
            <OrderFeeBreakdown
              order={order}
              audience="seller"
              showStatus
              lineClassName="border-[#4e4637]/10"
            />
            {order.cancelReason && (
              <p className="mt-3 rounded-md border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm font-semibold text-terracotta">
                {getCancelReasonText(order.cancelReason)}
              </p>
            )}
          </Panel>

          <Panel title="Vận chuyển" icon={<Truck />}>
            <div className="space-y-2 text-sm text-muted-warm">
              <InfoPair
                label="Trạng thái"
                value={getFulfillmentStatusText(order.fulfillment?.status)}
              />
              <InfoPair
                label="Hình thức"
                value={getDeliveryMethodText(order.fulfillment?.deliveryMethod)}
              />
              {order.fulfillment?.carrierName && (
                <InfoPair label="Đơn vị" value={order.fulfillment.carrierName} />
              )}
              <InfoPair label="Mã vận đơn" value={order.fulfillment?.trackingCode ?? "—"} />
            </div>
            {order.status === "PAID" && (
              <div className="mt-5 border-t border-[#4e4637]/10 pt-4">
                <ShippingConfirmationForm
                  isPending={mutations.confirmShipping.isPending}
                  onSubmit={ship}
                />
              </div>
            )}
          </Panel>
        </aside>
      </main>
    </div>
  );
}

function BuyerPanel({ buyer }: { buyer: OrderBuyerSummary | null }) {
  return (
    <Panel title="Buyer" icon={<UserRound />}>
      {buyer ? (
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#4e4637]/15 bg-[#F6F0E6] text-sm font-bold text-ink-blue">
            {buyer.fullName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-ink-blue">{buyer.fullName}</p>
            <div className="mt-2 grid gap-1.5 text-sm text-muted-warm">
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-brushed-brass" />
                <span className="truncate">{buyer.email}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-brushed-brass" />
                <span>{buyer.phoneNumber ?? "Chưa cập nhật"}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-warm">Chưa có dữ liệu buyer.</p>
      )}
    </Panel>
  );
}

function ReceiverPanel({ address }: { address: OrderShippingAddress | null }) {
  const addressLine = address
    ? [address.streetAddress, address.wardName, address.districtName, address.provinceName]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <Panel title="Người nhận hàng" icon={<MapPin />}>
      {address ? (
        <>
          <p className="font-bold text-ink-blue">{address.receiverName}</p>
          <p className="mt-1 text-sm text-muted-warm">{address.phoneNumber}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-blue">{addressLine}</p>
        </>
      ) : (
        <p className="text-sm text-muted-warm">Đơn chưa có snapshot địa chỉ giao hàng.</p>
      )}
    </Panel>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#4e4637]/15 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2 border-b border-[#4e4637]/10 pb-4">
        <span className="text-brushed-brass [&_svg]:size-5">{icon}</span>
        <h2 className="font-sans text-lg font-bold text-ink-blue">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#4e4637]/10 py-2.5 last:border-0">
      <span>{label}</span>
      <strong className="text-right text-ink-blue">{value}</strong>
    </div>
  );
}

function Timeline({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 border-l border-brushed-brass/30 pb-5 pl-4 last:pb-0">
      <div className="-ml-[21px] mt-1 size-2 rounded-full bg-brushed-brass" />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-warm">{label}</p>
        <p className="mt-1 text-sm font-semibold text-ink-blue">{formatDateTime(value)}</p>
      </div>
    </div>
  );
}

function OrderState({ title, loading }: { title: string; loading?: boolean }) {
  return (
    <div className="flex h-full items-center justify-center bg-warm-ivory">
      <div className="text-center text-ink-blue">
        {loading ? (
          <Loader2 className="mx-auto size-7 animate-spin" />
        ) : (
          <ReceiptText className="mx-auto size-8" />
        )}
        <p className="mt-4 font-bold">{title}</p>
        {!loading && (
          <Button asChild variant="outline" className="mt-5">
            <Link to={SELLER_PATHS.orders}>Quay lại đơn bán</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
