import type { ReactNode } from "react";
import {
  ArrowLeft,
  FileWarning,
  Loader2,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { useOrderDetail } from "@/features/order/hooks/useOrders";
import type { OrderDetail } from "@/features/order/types";
import { isApiError } from "@/shared/api/errors";
import { BUYER_PATHS, SELLER_PATHS } from "@/shared/constants/routes";
import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";

import { DisputeMessageComposer } from "../components/DisputeMessageComposer";
import { DisputeStatusBadge } from "../components/DisputeStatusBadge";
import { DisputeTimeline } from "../components/DisputeTimeline";
import { DISPUTE_STATUS_LABEL, isActiveDisputeStatus } from "../constants/disputeLabels";
import {
  useAddParticipantDisputeMessage,
  useCancelDispute,
  useDisputeDetail,
} from "../hooks/useDisputes";

type Audience = "buyer" | "seller";

export function BuyerDisputeDetailPage() {
  return <ParticipantDisputeDetailPage audience="buyer" />;
}

export function SellerDisputeDetailPage() {
  return <ParticipantDisputeDetailPage audience="seller" />;
}

function ParticipantDisputeDetailPage({ audience }: { audience: Audience }) {
  const { orderId: orderParam, disputeId: disputeParam } = useParams();
  const orderId = parseId(orderParam);
  const disputeId = parseId(disputeParam);
  const orderQuery = useOrderDetail(orderId);
  const disputeQuery = useDisputeDetail(orderId, disputeId);
  const addMessage = useAddParticipantDisputeMessage();
  const cancelDispute = useCancelDispute();
  const notification = useNotification();
  const dark = audience === "buyer";
  const detail = disputeQuery.data;
  const order = orderQuery.data;
  const backPath =
    audience === "buyer"
      ? BUYER_PATHS.orderDetail(orderId ?? "")
      : SELLER_PATHS.orderDetail(orderId ?? "");

  if (!orderId || !disputeId) {
    return <DisputePageState dark={dark} title="Đường dẫn hồ sơ tranh chấp không hợp lệ." />;
  }

  if (orderQuery.isPending || disputeQuery.isPending) {
    return <DisputeDetailSkeleton dark={dark} />;
  }

  if (orderQuery.isError || disputeQuery.isError || !order || !detail) {
    return (
      <DisputePageState
        dark={dark}
        title="Không thể tải hồ sơ tranh chấp."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void orderQuery.refetch();
              void disputeQuery.refetch();
            }}
          >
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        }
      />
    );
  }

  const { dispute } = detail;
  const active = isActiveDisputeStatus(dispute.status);
  const canCancel = audience === "buyer" && active;

  const cancel = async () => {
    try {
      await cancelDispute.mutateAsync({ orderId, disputeId });
      notification.success("Đã hủy tranh chấp.");
      void disputeQuery.refetch();
      void orderQuery.refetch();
    } catch (error) {
      notification.error("Không thể hủy tranh chấp", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      });
    }
  };

  return (
    <main
      data-testid="dispute-detail-page"
      className={cn(
        "min-h-full px-4 py-6 sm:px-6 lg:px-8",
        dark ? "bg-[#181612] text-[#f2eee5]" : "bg-warm-ivory text-[#181612]",
      )}
    >
      <div className="mx-auto max-w-[1240px]">
        <header
          className={cn(
            "flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between",
            dark ? "border-white/10" : "border-[#4e4637]/15",
          )}
        >
          <div className="min-w-0">
            <Button
              asChild
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "mb-4",
                dark && "border-white/15 bg-transparent text-[#f2eee5] hover:bg-white/10",
              )}
            >
              <Link to={backPath}>
                <ArrowLeft className="size-4" />
                Quay lại đơn hàng
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <p
                className={cn(
                  "text-xs font-bold uppercase tracking-[0.18em]",
                  dark ? "text-primary" : "text-brushed-brass",
                )}
              >
                Hồ sơ tranh chấp #{dispute.id}
              </p>
              <DisputeStatusBadge status={dispute.status} dark={dark} />
            </div>
            <h1
              className={cn(
                "mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl",
                dark ? "text-[#f2eee5]" : "text-ink-blue",
              )}
            >
              {order.product?.title ?? `Sản phẩm #${order.productId}`}
            </h1>
            <p className={cn("mt-2 text-sm", dark ? "text-[#d2c5b2]" : "text-muted-warm")}>
              Đơn #{order.id} · mở lúc {formatDateTime(dispute.openedAt)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void disputeQuery.refetch()}
            className={cn(
              "self-start lg:self-auto",
              dark && "border-white/15 bg-transparent text-[#f2eee5] hover:bg-white/10",
            )}
          >
            <RefreshCw className={cn("size-4", disputeQuery.isFetching && "animate-spin")} />
            Làm mới hồ sơ
          </Button>
        </header>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 space-y-5">
            <div
              className={cn(
                "rounded-lg border p-4 shadow-sm sm:p-5",
                dark ? "border-white/10 bg-white/[0.03]" : "border-[#4e4637]/15 bg-[#fffdf8]",
              )}
            >
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck
                  className={cn("size-5", dark ? "text-primary" : "text-brushed-brass")}
                />
                <h2 className={cn("font-bold", dark ? "text-[#f2eee5]" : "text-ink-blue")}>
                  Diễn biến vụ việc
                </h2>
              </div>
              <DisputeTimeline detail={detail} dark={dark} />
            </div>

            {active ? (
              <DisputeMessageComposer
                dark={dark}
                onSubmit={(payload) => addMessage.mutateAsync({ orderId, disputeId, payload })}
              />
            ) : (
              <div
                className={cn(
                  "rounded-lg border px-4 py-4 text-sm",
                  dark
                    ? "border-white/10 bg-white/[0.04] text-[#d2c5b2]"
                    : "border-[#4e4637]/15 bg-white text-muted-warm",
                )}
              >
                Hồ sơ đã chuyển sang trạng thái {DISPUTE_STATUS_LABEL[dispute.status].toLowerCase()}
                . Nội dung được giữ ở chế độ chỉ đọc.
              </div>
            )}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <OrderSummaryPanel order={order} dark={dark} />
            <section
              className={cn(
                "rounded-lg border p-5 shadow-sm",
                dark ? "border-white/10 bg-white/[0.04]" : "border-[#4e4637]/15 bg-white",
              )}
            >
              <h2 className={cn("font-bold", dark ? "text-[#f2eee5]" : "text-ink-blue")}>
                Nguyên tắc trao đổi
              </h2>
              <ul
                className={cn(
                  "mt-3 space-y-2 text-sm leading-6",
                  dark ? "text-[#d2c5b2]" : "text-muted-warm",
                )}
              >
                <li>Mỗi phản hồi được lưu cố định để bảo toàn bằng chứng.</li>
                <li>Có thể gửi nội dung, ảnh hoặc cả hai.</li>
                <li>Quản trị viên xem toàn bộ diễn biến trước khi đưa ra quyết định.</li>
              </ul>
              {canCancel && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={cancelDispute.isPending}
                  onClick={() => void cancel()}
                  className={cn(
                    "mt-5 w-full border-terracotta/30 text-terracotta hover:bg-terracotta/10",
                    dark && "bg-transparent",
                  )}
                >
                  {cancelDispute.isPending && <Loader2 className="size-4 animate-spin" />}
                  Hủy tranh chấp
                </Button>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function OrderSummaryPanel({ order, dark }: { order: OrderDetail; dark: boolean }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border shadow-sm",
        dark ? "border-white/10 bg-white/[0.04]" : "border-[#4e4637]/15 bg-white",
      )}
    >
      <div className="flex gap-4 p-4">
        <div
          className={cn(
            "size-20 shrink-0 overflow-hidden rounded-md",
            dark ? "bg-white/5" : "bg-[#F6F0E6]",
          )}
        >
          {order.product?.imageUrl ? (
            <img
              src={order.product.imageUrl}
              alt={order.product.title ?? ""}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <PackageSearch
                className={cn("size-7", dark ? "text-[#8d877c]" : "text-muted-warm")}
              />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className={cn("break-words font-bold", dark ? "text-[#f2eee5]" : "text-ink-blue")}>
            {order.product?.title ?? `Sản phẩm #${order.productId}`}
          </p>
          <p className={cn("mt-1 text-xs", dark ? "text-[#a49a88]" : "text-muted-warm")}>
            Đơn hàng #{order.id}
          </p>
          <p className={cn("mt-2 font-bold", dark ? "text-primary" : "text-brushed-brass")}>
            {formatVND(order.finalPrice)}
          </p>
        </div>
      </div>
    </section>
  );
}

function DisputeDetailSkeleton({ dark }: { dark: boolean }) {
  return (
    <main
      className={cn(
        "min-h-full px-4 py-6 sm:px-6 lg:px-8",
        dark ? "bg-[#181612]" : "bg-warm-ivory",
      )}
    >
      <div className="mx-auto max-w-[1240px] animate-pulse">
        <div className={cn("h-8 w-48 rounded", dark ? "bg-white/10" : "bg-[#4e4637]/10")} />
        <div
          className={cn("mt-4 h-10 max-w-xl rounded", dark ? "bg-white/10" : "bg-[#4e4637]/10")}
        />
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className={cn("h-[560px] rounded-lg", dark ? "bg-white/5" : "bg-white")} />
          <div className={cn("h-64 rounded-lg", dark ? "bg-white/5" : "bg-white")} />
        </div>
      </div>
    </main>
  );
}

function DisputePageState({
  dark,
  title,
  action,
}: {
  dark: boolean;
  title: string;
  action?: ReactNode;
}) {
  return (
    <main
      className={cn(
        "flex min-h-[60vh] items-center justify-center px-4",
        dark ? "bg-[#181612] text-[#f2eee5]" : "bg-warm-ivory text-ink-blue",
      )}
    >
      <div className="max-w-md text-center">
        <FileWarning
          className={cn("mx-auto size-9", dark ? "text-primary" : "text-brushed-brass")}
        />
        <p className="mt-4 font-bold">{title}</p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </main>
  );
}

function parseId(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
