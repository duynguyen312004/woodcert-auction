/**
 * Dialog xem chi tiết sản phẩm trong phòng đấu giá realtime.
 *
 * Component này mở rộng ProductPanel bằng thông tin mô tả, kích thước, khối lượng
 * và kết quả kiểm định từ auction detail, không điều hướng khỏi màn bidding.
 */

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Images,
  Info,
  Maximize2,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { formatVND } from "@/shared/lib/format";
import type { BiddingAuctionDetail } from "../types";

interface ProductDetailDialogProps {
  detail: BiddingAuctionDetail;
}

const CONDITION_LABEL: Record<string, string> = {
  EXCELLENT: "Xuất sắc",
  GOOD: "Tốt",
  FAIR: "Trung bình",
  POOR: "Cần lưu ý",
};

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Chưa cập nhật";
  }
  return String(value);
}

function formatWeight(weight: number | null) {
  if (weight === null) {
    return "Chưa cập nhật";
  }
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(weight)} kg`;
}

export function ProductDetailDialog({ detail }: ProductDetailDialogProps) {
  const product = detail.product;
  const appraisal = product?.appraisal;
  const images = Array.from(
    new Set([product?.primaryImage, ...(product?.imageUrls ?? [])].filter(Boolean)),
  ) as string[];
  const primaryImage = images[0] || "/assets/hero/woodcert-card-fallback.jpg";

  const [open, setOpen] = useState(false);
  const [prevPrimaryImage, setPrevPrimaryImage] = useState(primaryImage);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  // Đồng bộ index ảnh về 0 khi ảnh chính thay đổi bằng Render Phase State Update
  if (primaryImage !== prevPrimaryImage) {
    setPrevPrimaryImage(primaryImage);
    setSelectedIndex(0);
  }

  // Khi dialog đóng thì reset zoom
  const handleOpenChange = (next: boolean) => {
    if (!next) setZoomIndex(null);
    setOpen(next);
  };

  const selectedImage = images[selectedIndex] ?? primaryImage;

  const productRows = [
    { label: "Chất liệu công bố", value: product?.material },
    { label: "Kích thước", value: product?.dimensions },
    { label: "Khối lượng", value: formatWeight(product?.weight ?? null) },
  ];

  const appraisalRows = [
    { label: "Mã chứng nhận", value: appraisal?.certificateCode ?? product?.certificateCode },
    { label: "Chất liệu kiểm định", value: appraisal?.verifiedMaterial },
    { label: "Xuất xứ", value: appraisal?.origin },
    { label: "Ước tính tuổi gỗ", value: appraisal?.ageEstimation },
    {
      label: "Tình trạng",
      value: appraisal?.conditionGrade
        ? (CONDITION_LABEL[appraisal.conditionGrade] ?? appraisal.conditionGrade)
        : null,
    },
    {
      label: "Giá trị thẩm định",
      value: appraisal?.estimatedValue == null ? null : formatVND(appraisal.estimatedValue),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-between border-brushed-brass/30 bg-brushed-brass/5 text-brushed-brass hover:bg-brushed-brass/10 hover:text-brushed-brass"
        >
          <span className="inline-flex items-center gap-2">
            <Info className="size-4" aria-hidden />
            Xem chi tiết sản phẩm
          </span>
          <FileText className="size-4" aria-hidden />
        </Button>
      </DialogTrigger>

      {/* ── Dialog content ── */}
      <DialogContent
        className="h-[86vh] max-h-[86vh] max-w-4xl overflow-hidden p-0"
        // Ngăn dialog tự đóng khi click vào các button thumbnail bên trong
        onInteractOutside={(e) => {
          // Nếu zoom overlay đang hiển thị thì không cho dialog đóng
          if (zoomIndex !== null) {
            e.preventDefault();
          }
        }}
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-3 top-3 z-10 text-muted-foreground hover:text-foreground"
            aria-label="Đóng chi tiết sản phẩm"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </DialogClose>

        {/* Grid 2 cột: trái = ảnh cố định, phải = info scroll */}
        <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
          {/* ── Cột trái: ảnh – KHÔNG scroll, co vừa chiều cao ── */}
          <div className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border/60 bg-background/70 p-4">
            {/* Ảnh chính – bấm để phóng to */}
            <button
              type="button"
              onClick={() => setZoomIndex(selectedIndex)}
              className="group relative block w-full min-h-0 flex-1 overflow-hidden rounded-lg border border-border/60 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass"
              aria-label="Phóng to ảnh sản phẩm"
            >
              <img
                src={selectedImage}
                alt={product?.title ?? "Sản phẩm đấu giá"}
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-xs font-semibold text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                <Maximize2 className="size-3.5" aria-hidden />
                Phóng to
              </span>
            </button>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2 flex-shrink-0" aria-label="Ảnh sản phẩm">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={image}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(index);
                    }}
                    className={[
                      "relative overflow-hidden rounded-md border bg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass",
                      selectedIndex === index
                        ? "border-brushed-brass ring-2 ring-brushed-brass/30"
                        : "border-border/60 hover:border-brushed-brass/50",
                    ].join(" ")}
                    aria-label={`Chọn ảnh sản phẩm ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`Ảnh sản phẩm ${index + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Badge kiểm định */}
            <div className="mt-3 flex-shrink-0 flex items-center gap-2 rounded-lg border border-verdigris/20 bg-verdigris/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-verdigris">
              {product?.isAuthentic ? (
                <>
                  <ShieldCheck className="size-4" aria-hidden />
                  Đã kiểm định WoodCert
                </>
              ) : (
                <>
                  <Images className="size-4" aria-hidden />
                  Hồ sơ sản phẩm
                </>
              )}
            </div>
          </div>

          {/* ── Cột phải: thông tin – SCROLL ── */}
          <div className="h-full min-h-0 overflow-y-auto p-5">
            <DialogHeader className="mb-5 pr-8">
              <DialogTitle className="text-xl">{product?.title ?? "Sản phẩm đấu giá"}</DialogTitle>
              <DialogDescription>
                Thông tin sản phẩm được lấy từ hồ sơ đấu giá và kết quả kiểm định.
              </DialogDescription>
            </DialogHeader>

            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Mô tả
              </h3>
              <p className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm leading-6 text-foreground">
                {product?.description || "Sản phẩm chưa có mô tả chi tiết."}
              </p>
            </section>

            <section className="mt-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Thông số sản phẩm
              </h3>
              <dl className="divide-y divide-border/60 rounded-lg border border-border/60">
                {productRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 px-3 py-2.5"
                  >
                    <dt className="text-xs text-muted-foreground">{row.label}</dt>
                    <dd className="max-w-[58%] text-right text-sm font-semibold text-foreground">
                      {displayValue(row.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Kiểm định WoodCert
              </h3>
              <dl className="divide-y divide-border/60 rounded-lg border border-border/60">
                {appraisalRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 px-3 py-2.5"
                  >
                    <dt className="text-xs text-muted-foreground">{row.label}</dt>
                    <dd className="max-w-[58%] text-right text-sm font-semibold text-foreground">
                      {displayValue(row.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>

        {/* ── Zoom Dialog riêng biệt để tránh xung đột pointer-events với Dialog cha ── */}
        <DialogPrimitive.Root
          open={zoomIndex !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setZoomIndex(null);
          }}
        >
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
            <DialogPrimitive.Content
              className="fixed inset-0 z-[200] flex items-center justify-center focus:outline-none"
              onClick={() => setZoomIndex(null)}
            >
              {/* Nút đóng */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomIndex(null);
                }}
                className="absolute right-5 top-5 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none"
                aria-label="Đóng ảnh phóng to"
              >
                <X className="size-5" aria-hidden />
              </button>

              {/* Nút ← */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomIndex((prev) =>
                      prev === null ? 0 : (prev - 1 + images.length) % images.length,
                    );
                  }}
                  className="absolute left-5 top-1/2 -translate-y-1/2 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="size-6" aria-hidden />
                </button>
              )}

              {/* Ảnh phóng to */}
              <img
                src={zoomIndex !== null ? images[zoomIndex] : undefined}
                alt={product?.title ?? "Ảnh phóng to"}
                className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl select-none"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Nút → */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomIndex((prev) => (prev === null ? 0 : (prev + 1) % images.length));
                  }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none"
                  aria-label="Ảnh tiếp theo"
                >
                  <ChevronRight className="size-6" aria-hidden />
                </button>
              )}

              {/* Chỉ số ảnh */}
              {images.length > 1 && zoomIndex !== null && (
                <div
                  className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  {zoomIndex + 1} / {images.length}
                </div>
              )}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </DialogContent>
    </Dialog>
  );
}
