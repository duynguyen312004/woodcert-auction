import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackageSearch,
  WalletCards,
  Gavel,
  Trophy,
  Coins,
} from "lucide-react";
import { Link, useParams } from "react-router";

import { isApiError } from "@/shared/api/errors";
import { BUYER_PATHS } from "@/shared/constants/routes";
import { formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";

import { OrderSummaryCard } from "@/features/order";

import {
  useBuyerAuctionDetail,
  useConfirmReceived,
  usePayRemainder,
} from "../hooks/useBuyerAuctions";

function parseId(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function BuyerAuctionDetailPage() {
  const auctionId = parseId(useParams<{ auctionId: string }>().auctionId);
  const detailQuery = useBuyerAuctionDetail(auctionId);
  const payMutation = usePayRemainder();
  const completeMutation = useConfirmReceived();
  const notification = useNotification();
  const detail = detailQuery.data;
  const order = detail?.order;

  const pay = async () => {
    if (!order) return;
    try {
      await payMutation.mutateAsync(order.id);
      notification.success("Đã thanh toán phần còn lại");
      void detailQuery.refetch();
    } catch (error) {
      notification.error("Không thể thanh toán", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại sau.",
      });
    }
  };

  const complete = async () => {
    if (!order) return;
    try {
      await completeMutation.mutateAsync(order.id);
      notification.success("Đã xác nhận nhận hàng");
      void detailQuery.refetch();
    } catch (error) {
      notification.error("Không thể hoàn tất đơn", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại sau.",
      });
    }
  };

  if (!auctionId || detailQuery.isError) {
    return <State title="Không tìm thấy phiên đấu giá của bạn" />;
  }

  if (detailQuery.isPending || !detail) {
    return <State title="Đang tải chi tiết phiên" loading />;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1080px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
          <Link
            to={BUYER_PATHS.auctions}
            className="group inline-flex items-center gap-2 rounded-full border border-stone-300 bg-[#f2eee5] hover:bg-[#e9e2d6] text-stone-700 hover:text-stone-900 px-4 py-2 text-xs font-bold transition-all shadow-sm duration-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-[#d6a84f]" />
            <span className="font-sans">Quay lại Đấu giá của tôi</span>
          </Link>
          <p className="text-xs text-stone-500 font-sans">
            Mã phiên đấu giá: <span className="font-bold text-stone-700">#{detail.auctionId}</span>
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-[#f2eee5] text-stone-950 shadow-sm">
            <div className="aspect-square bg-stone-200 overflow-hidden">
              {detail.product.primaryImage ? (
                <img
                  src={detail.product.primaryImage}
                  alt={detail.product.title}
                  className="h-full w-full object-cover transition-transform duration-550 hover:scale-102"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-stone-400">
                  <PackageSearch className="h-12 w-12" />
                </div>
              )}
            </div>
            <div className="p-5 space-y-2">
              <h1 className="text-xl font-bold font-sans text-stone-900 leading-snug">
                {detail.product.title}
              </h1>
              {detail.outcomeMessage && (
                <p className="text-sm font-medium text-[#8d877c] font-sans leading-relaxed border-t border-stone-200/60 pt-2.5">
                  {detail.outcomeMessage}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-xl border border-stone-200 bg-[#f2eee5] p-6 text-stone-950 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-4">
                <h2 className="text-lg font-bold font-sans text-stone-900">Kết quả đấu giá</h2>
                <DetailStatusBadge code={detail.outcomeCode} />
              </div>

              {/* Hero stat block for current price */}
              <div className="rounded-xl border border-[#d6a84f]/30 bg-[#e9e2d6] p-5 shadow-inner">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#8d877c]">
                  <Gavel className="h-4 w-4 text-[#d6a84f]" />
                  <span>Giá cuối / Hiện tại</span>
                </div>
                <div className="mt-2 text-3xl font-extrabold text-stone-900 tracking-tight font-sans">
                  {formatVND(detail.currentPrice)}
                </div>
              </div>

              {/* Grid 2x2 for other auction stats */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-stone-200 bg-[#e9e2d6]/60 p-4 flex items-start gap-3">
                  <div className="rounded-md bg-stone-300/40 p-2 text-stone-600 shrink-0">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d877c] font-sans">
                      Giá khởi điểm
                    </p>
                    <p className="mt-1 text-sm font-bold text-stone-800 font-sans">
                      {formatVND(detail.startingPrice)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-stone-200 bg-[#e9e2d6]/60 p-4 flex items-start gap-3">
                  <div className="rounded-md bg-stone-300/40 p-2 text-stone-600 shrink-0">
                    <WalletCards className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d877c] font-sans">
                      Tiền đặt cọc
                    </p>
                    <p className="mt-1 text-sm font-bold text-stone-800 font-sans">
                      {formatVND(detail.depositAmount)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-stone-200 bg-[#e9e2d6]/60 p-4 flex items-start gap-3">
                  <div className="rounded-md bg-stone-300/40 p-2 text-stone-600 shrink-0">
                    <Gavel className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d877c] font-sans">
                      Lượt bid của bạn
                    </p>
                    <p className="mt-1 text-sm font-bold text-stone-800 font-sans">
                      {detail.myBidCount} lượt
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-stone-200 bg-[#e9e2d6]/60 p-4 flex items-start gap-3">
                  <div className="rounded-md bg-stone-300/40 p-2 text-[#d6a84f] shrink-0">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8d877c] font-sans">
                      Bid cao nhất của bạn
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#2f7d68] font-sans">
                      {detail.myHighestBid ? formatVND(detail.myHighestBid) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <OrderSummaryCard
              order={order}
              emptyMessage="Đơn sẽ xuất hiện nếu bạn thắng và hệ thống đối soát xong."
              actions={
                <>
                  {order?.status === "PENDING_PAYMENT" && (
                    <Button
                      type="button"
                      onClick={pay}
                      disabled={payMutation.isPending}
                      className="w-full bg-primary text-primary-foreground font-sans font-semibold py-2.5 transition-all duration-200 cursor-pointer hover:opacity-95 shadow-sm"
                    >
                      {payMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <WalletCards className="h-4 w-4" />
                      )}
                      Thanh toán {formatVND(order.remainingAmount)}
                    </Button>
                  )}
                  {order?.status === "FULFILLING" && order.fulfillment?.status === "SHIPPED" && (
                    <Button
                      type="button"
                      onClick={complete}
                      disabled={completeMutation.isPending}
                      className="w-full bg-primary text-primary-foreground font-sans font-semibold py-2.5 transition-all duration-200 cursor-pointer hover:opacity-95 shadow-sm"
                    >
                      {completeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Xác nhận nhận hàng
                    </Button>
                  )}
                </>
              }
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function DetailStatusBadge({ code }: { code: string }) {
  const label =
    {
      WINNER: "Đấu giá thành công (Thắng)",
      LOSER: "Đã kết thúc (Thua)",
      ACTIVE: "Đang diễn ra",
      PENDING: "Chờ mở phiên",
      PENDING_SETTLEMENT: "Chờ đối soát tài chính",
      ENDED_FAILED: "Thất bại (Không đạt giá sàn)",
      WITHDRAWN: "Đã rút trước khi bắt đầu",
      NONE: "Chưa xác định",
    }[code] ?? code;

  const styleClass =
    {
      WINNER: "bg-[#2f7d68]/15 text-[#2f7d68] border border-[#2f7d68]/30",
      LOSER: "bg-[#8d877c]/15 text-[#8d877c] border border-[#8d877c]/30",
      ACTIVE: "bg-[#d6a84f]/20 text-[#c8973b] border border-[#d6a84f]/40",
      PENDING: "bg-[#2e4a62]/15 text-[#2e4a62] border border-[#2e4a62]/30",
      PENDING_SETTLEMENT: "bg-[#2e4a62]/15 text-[#2e4a62] border border-[#2e4a62]/30",
      ENDED_FAILED: "bg-[#b5533e]/15 text-[#b5533e] border border-[#b5533e]/30",
      WITHDRAWN: "bg-stone-200 text-stone-700 border border-stone-300",
      NONE: "bg-stone-100 text-stone-600 border border-stone-200",
    }[code] ?? "bg-stone-900 text-white";

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-bold font-sans shadow-sm inline-block whitespace-nowrap",
        styleClass,
      )}
    >
      {label}
    </span>
  );
}

function State({ title, loading = false }: { title: string; loading?: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        {loading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        ) : (
          <PackageSearch className="mx-auto h-8 w-8" />
        )}
        <p className="mt-4 font-bold">{title}</p>
      </div>
    </main>
  );
}
