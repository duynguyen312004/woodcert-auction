/**
 * Seller-facing auction monitoring page.
 *
 * This page intentionally uses polling instead of bidding realtime. It gives the seller a
 * reliable operational snapshot without pulling buyer runtime into the seller scope.
 */
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Coins,
  Gavel,
  Loader2,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { isApiError } from "@/shared/api/errors";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useNotification } from "@/shared/ui/notification";

import { getOrderStatusText, OrderFeeBreakdown } from "@/features/order";

import {
  SELLER_AUCTION_STATUS_CLASS,
  SELLER_AUCTION_STATUS_LABEL,
} from "../constants/auctionStatus";
import { SELLER_PATHS } from "../constants/routes";
import { useCancelAuction, useConfirmShipping } from "../hooks/useProductMutations";
import { useSellerAuctionDetail } from "../hooks/useSellerDashboard";
import type { SellerAuctionDetail, SellerAuctionSettlementStatus } from "../types";

function parseAuctionId(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function settlementLabel(status: SellerAuctionSettlementStatus) {
  if (status === "SETTLED") return "Đã đối soát cọc";
  if (status === "PENDING") return "Còn cọc chờ xử lý";
  return "Chưa áp dụng";
}

export function SellerAuctionDetailPage() {
  const params = useParams();
  const auctionId = parseAuctionId(params.auctionId);
  const navigate = useNavigate();
  const notification = useNotification();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const detailQuery = useSellerAuctionDetail(auctionId);
  const cancelMutation = useCancelAuction();
  const confirmShippingMutation = useConfirmShipping();

  const auction = detailQuery.data;
  const canCancel = auction?.status === "WAITING";

  const handleCancel = async () => {
    if (!auctionId || !auction) return;

    try {
      await cancelMutation.mutateAsync(auctionId);
      notification.success("Đã hủy phiên đấu giá", { description: auction.product.title });
      setCancelOpen(false);
      void detailQuery.refetch();
    } catch (error: unknown) {
      notification.error("Không thể hủy phiên", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại sau.",
      });
    }
  };

  const handleConfirmShipping = async () => {
    const orderId = auction?.order?.id;
    if (!orderId) return;
    try {
      await confirmShippingMutation.mutateAsync({
        orderId,
        trackingCode: trackingCode.trim() || undefined,
      });
      notification.success("Đã xác nhận giao hàng", {
        description: trackingCode.trim() || auction?.product.title,
      });
      setTrackingCode("");
      void detailQuery.refetch();
    } catch (error: unknown) {
      notification.error("Không thể xác nhận giao hàng", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại sau.",
      });
    }
  };

  if (!auctionId) {
    return (
      <PageShell>
        <BlockingState
          icon="warning"
          title="Đường dẫn phiên không hợp lệ"
          description="Vui lòng quay lại danh sách phiên đấu giá của seller."
          action={
            <Button asChild className="bg-ink-blue text-white hover:bg-ink-blue/90">
              <Link to={SELLER_PATHS.auctions}>Quay lại danh sách</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="sticky top-0 z-10 border-b border-[#4e4637]/15 bg-warm-ivory/90 px-8 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Link
              to={SELLER_PATHS.auctions}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-warm transition-colors hover:text-ink-blue"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Phiên đấu giá
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-2xl font-bold text-ink-blue">
                {auction?.product.title ?? `Phiên #${auctionId}`}
              </h1>
              {auction && <AuctionStatusBadge status={auction.status} />}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void detailQuery.refetch()}
              className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
            >
              <RefreshCw className={cn("size-4", detailQuery.isFetching && "animate-spin")} />
              Làm mới
            </Button>
            {canCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelOpen(true)}
                className="border-red-500/30 bg-white text-red-600 hover:bg-red-50 hover:text-red-600 hover:border-red-500/40 active:scale-97 transition-all cursor-pointer"
              >
                <Trash2 className="size-4" aria-hidden />
                Hủy phiên
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] space-y-6 p-8">
          {detailQuery.isError ? (
            <BlockingState
              icon="warning"
              title="Không thể tải chi tiết phiên"
              description="Phiên có thể không tồn tại hoặc không thuộc gian hàng của bạn."
              action={
                <div className="flex justify-center gap-2">
                  <Button type="button" onClick={() => void detailQuery.refetch()}>
                    <RefreshCw className="size-4" />
                    Thử lại
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(SELLER_PATHS.auctions)}
                    className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
                  >
                    Quay lại
                  </Button>
                </div>
              }
            />
          ) : detailQuery.isPending || !auction ? (
            <BlockingState
              icon="loading"
              title="Đang tải phiên đấu giá"
              description="Hệ thống đang lấy dữ liệu giám sát mới nhất cho seller."
            />
          ) : (
            <>
              <LiveOverview auction={auction} />

              <div className="grid gap-6 lg:grid-cols-12">
                <section className="space-y-6 lg:col-span-7">
                  <ProductPanel auction={auction} />
                  <ResultPanel auction={auction} />
                </section>
                <aside className="space-y-6 lg:col-span-5">
                  <PricePanel auction={auction} />
                  <SellerOrderPanel
                    auction={auction}
                    trackingCode={trackingCode}
                    onTrackingCodeChange={setTrackingCode}
                    onConfirmShipping={handleConfirmShipping}
                    isConfirmingShipping={confirmShippingMutation.isPending}
                  />
                  <SchedulePanel auction={auction} />
                  <SettlementPanel auction={auction} />
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy phiên đấu giá?</DialogTitle>
            <DialogDescription>
              Phiên của sản phẩm “{auction?.product.title}” sẽ chuyển sang trạng thái đã hủy. Sản
              phẩm sẽ quay lại trạng thái sẵn sàng tạo phiên mới.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
              >
                Giữ lại
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-4" aria-hidden />
              )}
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col bg-warm-ivory">{children}</div>;
}

function AuctionStatusBadge({ status }: { status: SellerAuctionDetail["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border shadow-2xs transition-colors whitespace-nowrap",
        SELLER_AUCTION_STATUS_CLASS[status],
      )}
    >
      {SELLER_AUCTION_STATUS_LABEL[status]}
    </span>
  );
}

function LiveOverview({ auction }: { auction: SellerAuctionDetail }) {
  const countdownTarget = auction.status === "WAITING" ? auction.startTime : auction.endTime;
  const countdown = useCountdown(countdownTarget);
  const countdownLabel = auction.status === "WAITING" ? "Bắt đầu sau" : "Còn lại";

  return (
    <section className="grid gap-4 md:grid-cols-4">
      <MetricCard
        label="Giá hiện tại"
        value={formatVND(auction.currentPrice)}
        icon={<Gavel />}
        tone="red"
      />
      <MetricCard
        label="Người tham gia"
        value={auction.participantCount.toString()}
        icon={<Users />}
        tone="ink"
      />
      <MetricCard label={countdownLabel} value={countdown} icon={<CalendarClock />} tone="brass" />
      <MetricCard
        label="Trạng thái cọc"
        value={settlementLabel(auction.settlementStatus)}
        icon={<ShieldCheck />}
        tone={auction.settlementStatus === "PENDING" ? "red" : "green"}
      />
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "ink" | "brass" | "green" | "red";
}) {
  const toneClass = {
    ink: "text-ink-blue bg-ink-blue/10 border-ink-blue/15",
    brass: "text-brushed-brass bg-brushed-brass/10 border-brushed-brass/20",
    green: "text-verdigris bg-verdigris/10 border-verdigris/20",
    red: "text-terracotta bg-terracotta/10 border-terracotta/20",
  }[tone];

  return (
    <div className="rounded-lg border border-[#4e4637]/15 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-warm">{label}</p>
          <p className="mt-2 text-xl font-extrabold truncate tabular-nums text-ink-blue">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border",
            toneClass,
          )}
        >
          <span className="[&_svg]:size-5">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function ProductPanel({ auction }: { auction: SellerAuctionDetail }) {
  const product = auction.product;
  const image = product.primaryImage ?? product.images[0] ?? null;

  return (
    <Panel
      title="Sản phẩm đấu giá"
      description={`Mã sản phẩm #${product.id}`}
      icon={<PackageSearch className="size-5" />}
    >
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        <div className="aspect-square overflow-hidden rounded-lg border border-[#4e4637]/15 bg-[#eae1d6] shadow-2xs group">
          {image ? (
            <img
              src={image}
              alt={product.title}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-warm">
              <Gavel className="size-12" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex flex-col justify-between py-1">
          <div>
            <h2 className="font-serif text-xl font-bold text-ink-blue">{product.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-warm">
              {product.description || "Sản phẩm chưa có mô tả chi tiết."}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-4 grid-cols-2 sm:grid-cols-4 border-t border-[#4e4637]/10 pt-4">
        <div>
          <p className="text-xs font-semibold text-muted-warm">Chất liệu</p>
          <p className="mt-1 text-sm font-bold text-ink-blue truncate">
            {product.material ?? "Chưa xác định"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-warm">Kích thước</p>
          <p className="mt-1 text-sm font-bold text-ink-blue truncate">
            {product.dimensions ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-warm">Khối lượng</p>
          <p className="mt-1 text-sm font-bold text-ink-blue truncate">
            {product.weight != null ? `${product.weight} kg` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-warm">Chứng thư</p>
          <p
            className="mt-1 text-sm font-bold text-ink-blue truncate"
            title={product.appraisal?.certificateCode ?? ""}
          >
            {product.appraisal?.certificateCode ?? "Chưa có"}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function PricePanel({ auction }: { auction: SellerAuctionDetail }) {
  return (
    <Panel
      title="Giá và điều kiện"
      description="Các ngưỡng seller đã thiết lập"
      icon={<Coins className="size-5" />}
    >
      <div className="grid gap-3">
        <InfoLine label="Giá khởi điểm" value={formatVND(auction.startingPrice)} strong />
        <InfoLine label="Giá sàn" value={formatVND(auction.reservePrice)} strong />
        <InfoLine label="Bước giá" value={formatVND(auction.stepPrice)} />
        <InfoLine label="Tiền cọc" value={formatVND(auction.depositAmount)} />
        <InfoLine label="Giá hiện tại" value={formatVND(auction.currentPrice)} strong />
      </div>
    </Panel>
  );
}

function SellerOrderPanel({
  auction,
  trackingCode,
  onTrackingCodeChange,
  onConfirmShipping,
  isConfirmingShipping,
}: {
  auction: SellerAuctionDetail;
  trackingCode: string;
  onTrackingCodeChange: (value: string) => void;
  onConfirmShipping: () => void;
  isConfirmingShipping: boolean;
}) {
  const order = auction.order;

  if (!order) {
    return (
      <Panel
        title="Đơn sau đấu giá"
        description="Đơn sẽ được tạo sau khi hệ thống đối soát winner"
        icon={<ShieldCheck className="size-5" />}
      >
        <p className="rounded-lg border border-[#4e4637]/10 bg-[#F6F0E6]/70 p-4 text-sm text-muted-warm">
          Chưa có đơn hàng cho phiên này.
        </p>
      </Panel>
    );
  }

  const statusText = getOrderStatusText(order.status);

  return (
    <Panel
      title="Đơn sau đấu giá"
      description={statusText}
      icon={<ShieldCheck className="size-5" />}
    >
      <OrderFeeBreakdown
        order={order}
        audience="seller"
        lineClassName="border-[#4e4637]/10"
        labelClassName="text-xs font-semibold text-muted-warm"
        valueClassName="text-ink-blue"
      />

      {order.status === "PAID" && (
        <div className="mt-5 space-y-3 border-t border-[#4e4637]/10 pt-4">
          <input
            type="text"
            value={trackingCode}
            onChange={(event) => onTrackingCodeChange(event.target.value)}
            maxLength={120}
            placeholder="Mã vận chuyển (không bắt buộc)"
            className="h-10 w-full rounded-md border border-[#4e4637]/20 bg-white px-3 text-sm text-ink-blue shadow-sm focus-visible:border-brushed-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass/35"
          />
          <Button
            type="button"
            onClick={onConfirmShipping}
            disabled={isConfirmingShipping}
            className="w-full bg-ink-blue text-white hover:bg-ink-blue/90"
          >
            {isConfirmingShipping ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden />
            )}
            Xác nhận giao hàng
          </Button>
        </div>
      )}
    </Panel>
  );
}

function SchedulePanel({ auction }: { auction: SellerAuctionDetail }) {
  return (
    <Panel
      title="Lịch phiên"
      description="Theo giờ hệ thống"
      icon={<CalendarClock className="size-5" />}
    >
      <div className="space-y-3">
        <TimelineItem label="Tạo phiên" value={formatDateTime(auction.createdAt)} />
        <TimelineItem label="Bắt đầu" value={formatDateTime(auction.startTime)} />
        <TimelineItem label="Kết thúc" value={formatDateTime(auction.endTime)} />
        <TimelineItem label="Cập nhật" value={formatDateTime(auction.updatedAt)} />
      </div>
    </Panel>
  );
}

function ResultPanel({ auction }: { auction: SellerAuctionDetail }) {
  const isSuccess = auction.status === "ENDED_SUCCESS";
  const isFailed = auction.status === "ENDED_FAILED";

  if (!isSuccess && !isFailed) {
    return (
      <Panel
        title="Kết quả phiên"
        description="Kết quả sẽ xuất hiện sau khi phiên kết thúc"
        icon={<Trophy className="size-5" />}
      >
        <div className="flex items-center gap-3 rounded-lg border border-[#4e4637]/10 bg-[#F6F0E6]/70 p-4 text-sm text-muted-warm">
          <CalendarClock className="size-5 text-brushed-brass" />
          Phiên chưa có kết quả cuối cùng.
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Kết quả phiên"
      description="Tổng kết sau khi hệ thống đóng phiên"
      icon={<Trophy className="size-5" />}
    >
      <div
        className={cn(
          "rounded-lg border p-5",
          isSuccess
            ? "border-verdigris/25 bg-verdigris/10"
            : "border-terracotta/25 bg-terracotta/10",
        )}
      >
        <div className="flex items-start gap-3">
          {isSuccess ? (
            <CheckCircle2 className="mt-1 size-6 text-verdigris" />
          ) : (
            <XCircle className="mt-1 size-6 text-terracotta" />
          )}
          <div>
            <p className="font-serif text-xl font-bold text-ink-blue">
              {isSuccess ? "Đã chốt bán" : "Không đạt giá sàn"}
            </p>
            <p className="mt-1 text-sm text-muted-warm">
              Giá cuối:{" "}
              <span className="font-bold text-ink-blue">
                {formatVND(auction.finalPrice ?? auction.currentPrice)}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-warm">
              Winner:{" "}
              <span className="font-bold text-ink-blue">{auction.winnerMaskedAlias ?? "—"}</span>
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function SettlementPanel({ auction }: { auction: SellerAuctionDetail }) {
  const settlement = auction.settlement;

  return (
    <Panel
      title="Đối soát cọc"
      description={settlementLabel(auction.settlementStatus)}
      icon={<ShieldCheck className="size-5" />}
    >
      <div className="grid grid-cols-2 gap-3">
        <SettlementItem label="Đang giữ" value={settlement.frozen} tone="red" />
        <SettlementItem label="Đã hoàn" value={settlement.refunded} tone="green" />
        <SettlementItem label="Đã trừ" value={settlement.deducted} tone="ink" />
        <SettlementItem label="Tịch thu" value={settlement.confiscated} tone="brass" />
      </div>
    </Panel>
  );
}

function SettlementItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ink" | "brass" | "green" | "red";
}) {
  const color = {
    ink: "text-ink-blue",
    brass: "text-brushed-brass",
    green: "text-verdigris",
    red: "text-terracotta",
  }[tone];

  return (
    <div className="rounded-md border border-[#4e4637]/10 bg-[#F6F0E6]/45 p-3.5 shadow-2xs">
      <p className="text-xs font-semibold text-muted-warm">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", color)}>{value}</p>
    </div>
  );
}

function Panel({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#4e4637]/15 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#4e4637]/10 pb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-ink-blue">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-warm">{description}</p>}
        </div>
        {icon && <div className="text-brushed-brass shrink-0 size-5 [&_svg]:size-full">{icon}</div>}
      </div>
      {children}
    </section>
  );
}

function InfoLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#4e4637]/10 py-2.5 last:border-b-0">
      <span className="text-xs font-semibold text-muted-warm">{label}</span>
      <span className={cn("text-right text-sm text-ink-blue", strong && "font-bold tabular-nums")}>
        {value}
      </span>
    </div>
  );
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-brushed-brass/20 bg-brushed-brass/10 text-brushed-brass">
        <BadgeCheck className="size-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-warm">{label}</p>
        <p className="mt-1 text-sm font-bold text-ink-blue">{value}</p>
      </div>
    </div>
  );
}

function BlockingState({
  icon,
  title,
  description,
  action,
}: {
  icon: "loading" | "warning";
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[520px] items-center justify-center p-8">
      <section className="w-full max-w-md rounded-lg border border-[#4e4637]/15 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-ink-blue/15 bg-ink-blue/5 text-ink-blue">
          {icon === "loading" ? (
            <Loader2 className="size-7 animate-spin" aria-hidden />
          ) : (
            <AlertTriangle className="size-7" aria-hidden />
          )}
        </div>
        <h2 className="mt-5 font-serif text-xl font-bold text-ink-blue">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-warm">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </section>
    </div>
  );
}
