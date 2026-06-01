/**
 * Trang chi tiết public của phiên đấu giá.
 *
 * Màn này nối luồng duyệt danh sách với phòng bidding, đồng thời giữ detail public
 * không phụ thuộc đăng nhập để guest vẫn xem được sản phẩm và điều kiện tham gia.
 */
import {
  Award,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Gavel,
  Maximize2,
  ShieldCheck,
  Store,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { useAuthStore } from "@/shared/auth/auth-store";
import { formatTimeRemaining } from "@/shared/hooks/useCountdown";
import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";

import { AUCTION_STATUS_LABEL } from "../constants/auctionStatus";
import { usePublicAuctionDetail } from "../hooks/usePublicAuctionDetail";
import type { AuctionDetail } from "../types";

const fallbackProductImage = "/assets/hero/woodcert-card-fallback.jpg";
const WARNING_THRESHOLD_MS = 60 * 60 * 1000;
const URGENT_THRESHOLD_MS = 15 * 60 * 1000;

export function AuctionDetailPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const authStatus = useAuthStore((state) => state.status);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const detailQuery = usePublicAuctionDetail(auctionId ?? "");

  const auction = detailQuery.data;
  const imageUrls = useMemo(() => buildGalleryImages(auction), [auction]);
  const countdownTarget = auction?.status === "WAITING" ? auction.startTime : auction?.endTime;
  const countdownLabel = formatTimeRemaining(countdownTarget, now, {
    separator: " : ",
    showDays: true,
    endedLabel: auction?.status === "WAITING" ? "Đang mở" : "Đã kết thúc",
  });
  const timeState = getAuctionTimeState(auction, now);

  useEffect(() => {
    if (!countdownTarget) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [countdownTarget]);

  if (!auctionId) {
    return <DetailState title="Mã phiên đấu giá không hợp lệ" />;
  }

  if (detailQuery.isLoading) {
    return <AuctionDetailSkeleton />;
  }

  if (detailQuery.isError || !auction) {
    return (
      <DetailState
        title="Không tìm thấy phiên đấu giá"
        description="Phiên đấu giá không tồn tại hoặc đã bị gỡ khỏi khu vực public."
      />
    );
  }

  const product = auction.product;
  const activeImage =
    imageUrls[Math.min(activeImageIndex, imageUrls.length - 1)] ?? fallbackProductImage;
  const isLive = auction.status === "WAITING" || auction.status === "ACTIVE";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <main className="grid gap-8 xl:grid-cols-[minmax(0,760px)_minmax(430px,1fr)] 2xl:grid-cols-[minmax(0,820px)_minmax(440px,1fr)]">
          <section className="min-w-0">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-stone-950">
              <button
                type="button"
                onClick={() => setIsViewerOpen(true)}
                className="group relative block aspect-[4/3] w-full bg-stone-900 text-left sm:aspect-[10/8] xl:aspect-[10/8.6]"
                aria-label="Phóng to ảnh sản phẩm"
              >
                <img
                  src={activeImage}
                  alt={product?.title ?? "Sản phẩm đấu giá WoodCert"}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                />
                <div className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-md border border-white/15 bg-background/80 px-3 py-2 text-xs font-bold text-white shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur transition-colors group-hover:border-primary/40 group-hover:text-primary">
                  <Maximize2 className="h-4 w-4" />
                  Phóng to
                </div>
                {product?.isAuthentic && (
                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-background/85 px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur">
                    <ShieldCheck className="h-4 w-4" />
                    WoodCert Verified
                  </div>
                )}
              </button>
            </div>

            {imageUrls.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
                {imageUrls.slice(0, 6).map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={cn(
                      "aspect-square overflow-hidden rounded-lg border bg-stone-950 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]",
                      activeImageIndex === index
                        ? "border-primary ring-2 ring-primary/25"
                        : "border-white/10 hover:border-primary/50",
                    )}
                    aria-label={`Xem ảnh sản phẩm ${index + 1}`}
                  >
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="min-w-0">
            <div className="rounded-xl border border-white/10 bg-[#f2eee5] p-5 text-stone-950 shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:p-7">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <StatusBadge status={auction.status} />
                {product?.appraisal?.certificateCode && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#edf3ec] px-2.5 py-1 text-xs font-semibold text-[#346538]">
                    <Award className="h-3.5 w-3.5" />
                    {product.appraisal.certificateCode}
                  </span>
                )}
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
                {product?.material ?? "Chất liệu đang cập nhật"}
              </p>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-stone-950 sm:text-4xl 2xl:text-5xl">
                {product?.title ?? "Phiên đấu giá WoodCert"}
              </h1>

              <div className="mt-7 grid gap-3 sm:grid-cols-3 xl:grid-cols-2">
                <MetricBlock
                  label={auction.status === "WAITING" ? "Giá khởi điểm" : "Giá hiện tại"}
                  value={formatVND(auction.currentPrice)}
                  className="xl:col-span-2"
                />
                <MetricBlock label="Bước giá" value={formatVND(auction.stepPrice)} />
                <MetricBlock label="Ký quỹ" value={formatVND(auction.depositAmount)} />
              </div>

              <div className="mt-6 rounded-lg border border-stone-300 bg-[#e9e2d6] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div
                      className={cn(
                        "mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]",
                        timeState.labelClassName,
                      )}
                    >
                      <Timer className="h-4 w-4" />
                      {timeState.heading}
                    </div>
                    <p
                      className={cn(
                        "font-mono text-2xl font-bold tabular-nums transition-colors",
                        timeState.valueClassName,
                      )}
                    >
                      {isLive ? countdownLabel : AUCTION_STATUS_LABEL[auction.status]}
                    </p>
                    {timeState.note && (
                      <p className={cn("mt-2 text-xs font-semibold", timeState.noteClassName)}>
                        {timeState.note}
                      </p>
                    )}
                  </div>
                  {auction.highestBidderMaskedAlias && (
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                        Đang dẫn
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-stone-800">
                        {auction.highestBidderMaskedAlias}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <AuctionDetailCta auction={auction} authStatus={authStatus} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoPanel icon={CalendarClock} title="Lịch phiên">
                <InfoRow label="Bắt đầu" value={formatDateTime(auction.startTime)} />
                <InfoRow label="Kết thúc" value={formatDateTime(auction.endTime)} />
              </InfoPanel>

              <InfoPanel icon={Store} title="Nhà bán">
                <InfoRow label="Gian hàng" value={auction.seller?.storeName ?? "WoodCert Seller"} />
                <InfoRow
                  label="Điểm uy tín"
                  value={
                    auction.seller
                      ? `${auction.seller.reputationScore.toFixed(1)}/5`
                      : "Đang cập nhật"
                  }
                />
              </InfoPanel>
            </div>
          </section>
        </main>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-xl border border-white/10 bg-[#f2eee5] p-5 text-stone-950 shadow-[0_18px_48px_rgba(0,0,0,0.18)] sm:p-7">
            <h2 className="text-xl font-bold tracking-tight text-stone-950">Thông tin sản phẩm</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600">
              {product?.description || "Người bán chưa bổ sung mô tả chi tiết cho sản phẩm này."}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <SpecItem label="Chất liệu" value={product?.material ?? "Đang cập nhật"} />
              <SpecItem label="Kích thước" value={product?.dimensions ?? "Đang cập nhật"} />
              <SpecItem
                label="Khối lượng"
                value={product?.weight != null ? `${product.weight} kg` : "Đang cập nhật"}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#f2eee5] p-5 text-stone-950 shadow-[0_18px_48px_rgba(0,0,0,0.18)] sm:p-7">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#346538]" />
              <h2 className="text-lg font-bold tracking-tight text-stone-950">Chứng nhận</h2>
            </div>
            <InfoRow
              label="Mã chứng nhận"
              value={
                product?.appraisal?.certificateCode ?? product?.certificateCode ?? "Đang cập nhật"
              }
            />
            <InfoRow label="Nguồn gốc" value={product?.appraisal?.origin ?? "Đang cập nhật"} />
            <InfoRow
              label="Tuổi ước tính"
              value={product?.appraisal?.ageEstimation ?? "Đang cập nhật"}
            />
            <InfoRow
              label="Cấp tình trạng"
              value={product?.appraisal?.conditionGrade ?? "Đang cập nhật"}
            />
            <InfoRow
              label="Giá trị thẩm định"
              value={
                product?.appraisal?.estimatedValue
                  ? formatVND(product.appraisal.estimatedValue)
                  : "Đang cập nhật"
              }
            />
          </div>
        </section>
      </div>

      <ImageViewer
        title={product?.title ?? "Sản phẩm đấu giá WoodCert"}
        images={imageUrls}
        activeImageIndex={activeImageIndex}
        isOpen={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        onSelectImage={setActiveImageIndex}
      />
    </div>
  );
}

function buildGalleryImages(auction: AuctionDetail | undefined) {
  const images = [
    auction?.product?.primaryImage || fallbackProductImage,
    ...(auction?.product?.imageUrls ?? []),
  ];
  return [...new Set(images.filter(Boolean))];
}

function getAuctionTimeState(auction: AuctionDetail | undefined, now: number) {
  if (!auction) {
    return {
      heading: "Còn lại",
      labelClassName: "text-stone-400",
      valueClassName: "text-stone-950",
      note: "",
      noteClassName: "text-stone-500",
    };
  }

  if (auction.status === "WAITING") {
    return {
      heading: "Mở sau",
      labelClassName: "text-stone-500",
      valueClassName: "text-stone-950",
      note: "",
      noteClassName: "text-stone-500",
    };
  }

  if (auction.status !== "ACTIVE") {
    return {
      heading: "Trạng thái",
      labelClassName: "text-stone-500",
      valueClassName: "text-stone-950",
      note: "",
      noteClassName: "text-stone-500",
    };
  }

  const endTimestamp = new Date(auction.endTime).getTime();
  const remainingMs = Number.isNaN(endTimestamp) ? Number.POSITIVE_INFINITY : endTimestamp - now;

  if (remainingMs <= URGENT_THRESHOLD_MS) {
    return {
      heading: "Sắp kết thúc",
      labelClassName: "text-red-700",
      valueClassName: "animate-pulse text-red-700",
      note: "Giai đoạn nước rút, hãy vào phòng đấu giá nếu muốn theo dõi sát.",
      noteClassName: "text-red-700",
    };
  }

  if (remainingMs <= WARNING_THRESHOLD_MS) {
    return {
      heading: "Còn ít thời gian",
      labelClassName: "text-[#956400]",
      valueClassName: "text-[#956400]",
      note: "Phiên đang tiến gần thời điểm đóng.",
      noteClassName: "text-[#956400]",
    };
  }

  return {
    heading: "Còn lại",
    labelClassName: "text-stone-500",
    valueClassName: "text-stone-950",
    note: "",
    noteClassName: "text-stone-500",
  };
}

function ImageViewer({
  title,
  images,
  activeImageIndex,
  isOpen,
  onOpenChange,
  onSelectImage,
}: {
  title: string;
  images: string[];
  activeImageIndex: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImage: (index: number) => void;
}) {
  const activeImage = images[Math.min(activeImageIndex, images.length - 1)] ?? fallbackProductImage;
  const canMove = images.length > 1;

  const selectOffset = (offset: number) => {
    if (!canMove) return;
    onSelectImage((activeImageIndex + offset + images.length) % images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-[min(1180px,94vw)] overflow-hidden border-white/10 bg-background p-0 text-foreground">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Trình xem ảnh phóng to của sản phẩm đấu giá.
        </DialogDescription>

        <div className="relative flex max-h-[92dvh] flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            <DialogClose className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-stone-200 transition-colors hover:bg-white/10 hover:text-white">
              Đóng
            </DialogClose>
          </div>

          <div className="relative min-h-0 flex-1 bg-black">
            <img src={activeImage} alt={title} className="max-h-[72dvh] w-full object-contain" />

            {canMove && (
              <>
                <button
                  type="button"
                  onClick={() => selectOffset(-1)}
                  className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background/70 text-white backdrop-blur transition-colors hover:border-primary/50 hover:text-primary"
                  aria-label="Xem ảnh trước"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => selectOffset(1)}
                  className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background/70 text-white backdrop-blur transition-colors hover:border-primary/50 hover:text-primary"
                  aria-label="Xem ảnh tiếp theo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-background px-4 py-3">
              {images.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-viewer-${index}`}
                  type="button"
                  onClick={() => onSelectImage(index)}
                  className={cn(
                    "h-16 w-20 shrink-0 overflow-hidden rounded-md border bg-stone-950 transition-colors",
                    activeImageIndex === index
                      ? "border-primary"
                      : "border-white/10 hover:border-primary/50",
                  )}
                  aria-label={`Xem ảnh phóng to ${index + 1}`}
                >
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuctionDetailCta({
  auction,
  authStatus,
}: {
  auction: AuctionDetail;
  authStatus: "loading" | "anonymous" | "authenticated";
}) {
  const isLive = auction.status === "WAITING" || auction.status === "ACTIVE";

  if (auction.status === "CANCELED") {
    return (
      <p className="mt-6 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-600">
        Phiên đấu giá đã hủy. Bạn vẫn có thể xem thông tin sản phẩm để tham khảo.
      </p>
    );
  }

  if (!isLive) {
    return (
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="h-11 rounded-md bg-stone-950 text-white hover:bg-stone-800">
          <Link to={`/bidding/${auction.id}`}>
            <Gavel className="h-4 w-4" />
            Xem kết quả cá nhân
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-md border-stone-300 bg-[#f2eee5] text-stone-950 hover:bg-[#e7dfd0] hover:text-stone-950"
        >
          <Link to="/auctions">Xem phiên khác</Link>
        </Button>
      </div>
    );
  }

  if (authStatus === "loading") {
    return (
      <Button disabled className="mt-6 h-11 w-full rounded-md bg-stone-950 text-white">
        Đang xác thực phiên
      </Button>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <Button
        asChild
        className="h-11 rounded-md bg-stone-950 px-5 text-white transition-transform hover:bg-stone-800 active:scale-[0.98]"
      >
        <Link to={`/bidding/${auction.id}`}>
          <Gavel className="h-4 w-4" />
          {authStatus === "anonymous" ? "Đăng nhập để tham gia" : "Vào phòng đấu giá"}
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        className="h-11 rounded-md border-stone-300 bg-[#f2eee5] text-stone-950 hover:bg-[#e7dfd0] hover:text-stone-950"
      >
        <Link to="/wallet/deposit" target="_blank" rel="noreferrer">
          Nạp ví VNPay
        </Link>
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: AuctionDetail["status"] }) {
  const classes: Record<AuctionDetail["status"], string> = {
    WAITING: "bg-[#e1f3fe] text-[#1f6c9f]",
    ACTIVE: "bg-[#edf3ec] text-[#346538]",
    ENDED_SUCCESS: "bg-stone-100 text-stone-700",
    ENDED_FAILED: "bg-[#fbf3db] text-[#956400]",
    CANCELED: "bg-[#fdebec] text-[#9f2f2d]",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
        classes[status],
      )}
    >
      {AUCTION_STATUS_LABEL[status]}
    </span>
  );
}

function MetricBlock({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-stone-300 bg-[#e9e2d6] p-4", className)}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
        {label}
      </p>
      <p className="break-words font-mono text-lg font-bold text-stone-950">{value}</p>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#f2eee5] p-5 text-stone-950 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
      <div className="mb-4 flex items-center gap-2 text-stone-950">
        <Icon className="h-5 w-5 text-stone-500" />
        <h2 className="font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-3 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-right text-sm font-semibold text-stone-900">{value}</span>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-300 bg-[#e9e2d6] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function DetailState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && (
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      )}
      <Button
        asChild
        variant="outline"
        className="rounded-md border-white/15 bg-background text-foreground hover:bg-white/10 hover:text-foreground"
      >
        <Link to="/auctions">Quay lại danh sách</Link>
      </Button>
    </div>
  );
}

function AuctionDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="aspect-[16/11] animate-pulse rounded-xl bg-white/10" />
        <div className="rounded-xl border border-white/10 bg-[#f2eee5] p-7">
          <div className="mb-5 h-6 w-32 animate-pulse rounded bg-stone-300" />
          <div className="h-12 w-4/5 animate-pulse rounded bg-stone-300" />
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="h-24 animate-pulse rounded-lg bg-stone-200" />
            <div className="h-24 animate-pulse rounded-lg bg-stone-200" />
            <div className="h-24 animate-pulse rounded-lg bg-stone-200" />
          </div>
          <div className="mt-6 h-28 animate-pulse rounded-lg bg-stone-200" />
        </div>
      </div>
    </div>
  );
}
