import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  Gavel,
  ImageOff,
  Loader2,
  PackageCheck,
  Pencil,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { ProductSaleStatusBadge, ProductStatusBadge } from "../components/ProductStatusBadge";
import { useSellerCapability } from "../components/SellerCapabilityProvider";
import { SELLER_PATHS } from "../constants/routes";
import { useSellerProductDetail } from "../hooks/useSellerDashboard";
import type {
  ConditionGrade,
  ProductDetail,
  ProductDetailImage,
  ProductStatus,
  SellerAppraisalReport,
} from "../types";

const CONDITION_GRADE_LABEL: Record<ConditionGrade, string> = {
  EXCELLENT: "Xuất sắc",
  GOOD: "Tốt",
  FAIR: "Bình thường",
  POOR: "Kém",
};

export function SellerProductDetailPage() {
  const { isSuspended } = useSellerCapability();
  const { productId } = useParams();
  const id = productId ? Number(productId) : undefined;
  const validId = Number.isFinite(id) && (id as number) > 0 ? id : undefined;
  const query = useSellerProductDetail(validId);
  const product = query.data;

  if (!validId) {
    return <NotFoundState />;
  }

  if (query.isPending) {
    return (
      <div className="flex h-full items-center justify-center bg-warm-ivory">
        <Loader2 className="size-6 animate-spin text-brushed-brass" aria-hidden />
        <span className="sr-only">Đang tải chi tiết sản phẩm</span>
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  if (!product) {
    return <NotFoundState />;
  }

  const canCreateAuction =
    !isSuspended && product.status === "APPRAISED" && product.saleStatus === "AVAILABLE";

  return (
    <div className="min-h-full bg-warm-ivory text-[#181612]">
      <header className="sticky top-0 z-10 flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-[#4e4637]/20 bg-warm-ivory/90 px-5 py-3 backdrop-blur-md md:px-8">
        <Button
          asChild
          variant="outline"
          className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
        >
          <Link to={SELLER_PATHS.products}>
            <ArrowLeft className="size-4" />
            Sản phẩm
          </Link>
        </Button>

        <div className="flex flex-wrap justify-end gap-2">
          {product.status === "DRAFT" && !isSuspended && (
            <Button
              asChild
              variant="outline"
              className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
            >
              <Link to={SELLER_PATHS.editProduct(product.id)}>
                <Pencil className="size-4" />
                Chỉnh sửa
              </Link>
            </Button>
          )}
          {product.status === "APPRAISED" && product.appraisalReport && (
            <Button
              asChild
              variant="outline"
              className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
            >
              <Link
                to={`/certificates/${product.appraisalReport.certificateCode}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Award className="size-4" />
                Xem chứng thư
              </Link>
            </Button>
          )}
          {canCreateAuction && (
            <Button asChild className="bg-ink-blue text-white hover:bg-ink-blue/90">
              <Link to={`${SELLER_PATHS.newAuction}?productId=${product.id}`}>
                <Gavel className="size-4" />
                Tạo phiên đấu giá
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] space-y-6 p-5 md:p-8">
        <div className="grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          <ProductGallery images={product.images} title={product.title} />
          <ProductSummary product={product} />
        </div>

        <AppraisalProgress product={product} />

        {product.appraisalReport && (
          <AppraisalReportSection
            report={product.appraisalReport}
            status={product.status}
            rejectedReason={product.rejectedReason}
          />
        )}
      </main>
    </div>
  );
}

function ProductGallery({ images, title }: { images: ProductDetailImage[]; title: string }) {
  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [selectedId, setSelectedId] = useState<number | null>(
    sortedImages.find((image) => image.isPrimary)?.id ?? sortedImages[0]?.id ?? null,
  );
  const selectedImage =
    sortedImages.find((image) => image.id === selectedId) ?? sortedImages[0] ?? null;

  return (
    <section className="space-y-3" aria-label="Hình ảnh sản phẩm">
      <div className="aspect-square overflow-hidden rounded-xl border border-[#4e4637]/15 bg-white shadow-sm">
        {selectedImage?.imageUrl ? (
          <img src={selectedImage.imageUrl} alt={title} className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-warm">
            <ImageOff className="size-9 opacity-50" aria-hidden />
            <span className="text-sm">Chưa có ảnh sản phẩm</span>
          </div>
        )}
      </div>

      {sortedImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {sortedImages.slice(0, 10).map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedId(image.id)}
              className={cn(
                "aspect-square overflow-hidden rounded-md border-2 bg-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass/50",
                selectedImage?.id === image.id
                  ? "border-brushed-brass shadow-sm"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`Xem ảnh sản phẩm ${index + 1}`}
            >
              <img src={image.imageUrl} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductSummary({ product }: { product: ProductDetail }) {
  return (
    <section className="rounded-xl border border-[#4e4637]/15 bg-white p-6 shadow-sm md:p-7">
      <div className="flex flex-wrap gap-2">
        <ProductStatusBadge status={product.status} />
        <ProductSaleStatusBadge status={product.saleStatus} />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-brushed-brass">
        Sản phẩm #{product.id}
      </p>
      <h1 className="mt-1 text-wrap-balance font-serif text-3xl font-bold text-ink-blue">
        {product.title}
      </h1>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#4e4637]">
        {product.description ?? "Không có mô tả."}
      </p>

      <dl className="mt-7 grid gap-x-6 gap-y-5 border-t border-[#4e4637]/10 pt-6 sm:grid-cols-2">
        <Info label="Danh mục" value={product.category?.name ?? "—"} />
        <Info label="Chất liệu khai báo" value={product.material ?? "—"} />
        <Info label="Kích thước" value={product.dimensions ?? "—"} />
        <Info label="Khối lượng" value={product.weight ? `${product.weight} kg` : "—"} />
        <Info label="Ngày tạo" value={formatDateTime(product.createdAt)} />
        <Info label="Ngày gửi kiểm định" value={formatDateTime(product.submittedAt ?? undefined)} />
      </dl>
    </section>
  );
}

function AppraisalProgress({ product }: { product: ProductDetail }) {
  const statusCopy: Record<ProductStatus, { title: string; description: string }> = {
    DRAFT: {
      title: "Sản phẩm đang ở bản nháp",
      description: "Hoàn thiện thông tin và gửi yêu cầu để bắt đầu quy trình kiểm định.",
    },
    PENDING_APPRAISAL: {
      title: "Đang chờ kiểm định viên tiếp nhận",
      description: "Yêu cầu đã được ghi nhận và đang nằm trong hàng chờ kiểm định.",
    },
    UNDER_APPRAISAL: {
      title: "Kiểm định viên đang đánh giá sản phẩm",
      description: "Thông tin kỹ thuật và bằng chứng đang được đối chiếu.",
    },
    APPRAISED: {
      title: "Sản phẩm đã được xác thực",
      description: "Báo cáo kiểm định và chứng thư đã sẵn sàng để xem.",
    },
    REJECTED: {
      title: "Sản phẩm không đạt kiểm định",
      description: "Xem kết luận, ghi chú và ảnh bằng chứng trong báo cáo bên dưới.",
    },
  };

  const completed = product.status === "APPRAISED";
  const rejected = product.status === "REJECTED";
  const activeIndex =
    product.status === "DRAFT"
      ? 0
      : product.status === "PENDING_APPRAISAL"
        ? 1
        : product.status === "UNDER_APPRAISAL"
          ? 2
          : 3;
  const stages = [
    { label: "Chuẩn bị hồ sơ", icon: PackageCheck },
    { label: "Chờ tiếp nhận", icon: Clock3 },
    { label: "Đang đánh giá", icon: ShieldCheck },
    { label: rejected ? "Không đạt" : "Hoàn tất", icon: rejected ? XCircle : FileCheck2 },
  ];
  const copy = statusCopy[product.status];

  return (
    <section className="rounded-xl border border-[#4e4637]/15 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            completed && "bg-verdigris/10 text-verdigris",
            rejected && "bg-red-500/10 text-red-600",
            !completed && !rejected && "bg-brushed-brass/10 text-brushed-brass",
          )}
        >
          {completed ? (
            <CheckCircle2 className="size-5" />
          ) : rejected ? (
            <XCircle className="size-5" />
          ) : (
            <Clock3 className="size-5" />
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-warm">
            Tiến trình kiểm định
          </p>
          <h2 className="mt-1 font-serif text-xl font-bold text-ink-blue">{copy.title}</h2>
          <p className="mt-1 text-sm text-muted-warm">{copy.description}</p>
        </div>
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-4">
        {stages.map(({ label, icon: Icon }, index) => {
          const isPassed = index < activeIndex;
          const isCurrent = index === activeIndex;
          const isCompleted = product.status === "APPRAISED";
          const isRejected = product.status === "REJECTED";

          return (
            <li
              key={label}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition-all",
                isCurrent
                  ? isRejected
                    ? "border-red-500 bg-red-500/5 text-red-600 ring-1 ring-red-500"
                    : isCompleted
                      ? "border-verdigris bg-verdigris/10 text-verdigris"
                      : "border-brushed-brass bg-brushed-brass/10 text-ink-blue ring-1 ring-brushed-brass"
                  : isPassed
                    ? "border-verdigris/20 bg-verdigris/5 text-verdigris/80"
                    : "border-[#4e4637]/10 bg-[#f6f0e6]/40 text-muted-warm/60",
              )}
            >
              <div className="flex items-center gap-2">
                {isPassed ? (
                  <CheckCircle2 className="size-4 shrink-0 text-verdigris" aria-hidden />
                ) : (
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isCurrent && !isRejected && !isCompleted && "text-brushed-brass",
                    )}
                    aria-hidden
                  />
                )}
                <span>{label}</span>
              </div>
              {isCurrent && !isCompleted && !isRejected && (
                <span className="inline-flex items-center rounded-full bg-brushed-brass/25 px-1.5 py-0.5 text-[10px] font-bold text-brushed-brass animate-pulse shrink-0">
                  Hiện tại
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function AppraisalReportSection({
  report,
  status,
  rejectedReason,
}: {
  report: SellerAppraisalReport;
  status: ProductStatus;
  rejectedReason?: string | null;
}) {
  const approved = status === "APPRAISED" && report.isAuthentic;
  const proofImages = report.proofImages ?? [];

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border bg-white shadow-sm",
        approved ? "border-verdigris/25" : "border-red-500/25",
      )}
      aria-labelledby="appraisal-report-heading"
    >
      <div
        className={cn(
          "flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between",
          approved ? "border-verdigris/15 bg-verdigris/5" : "border-red-500/15 bg-red-500/5",
        )}
      >
        <div className="flex items-start gap-3">
          {approved ? (
            <CheckCircle2 className="mt-0.5 size-6 text-verdigris" aria-hidden />
          ) : (
            <XCircle className="mt-0.5 size-6 text-red-600" aria-hidden />
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-warm">
              Báo cáo kiểm định
            </p>
            <h2
              id="appraisal-report-heading"
              className="mt-1 font-serif text-2xl font-bold text-ink-blue"
            >
              {approved ? "Kết quả xác thực hợp lệ" : "Kết quả không đạt kiểm định"}
            </h2>
          </div>
        </div>
        <div className="rounded-md border border-[#4e4637]/15 bg-white px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-warm">
            Mã chứng nhận
          </p>
          <p className="font-mono text-sm font-bold text-ink-blue">{report.certificateCode}</p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {!approved && rejectedReason && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">Lý do từ chối</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-red-700">
              {rejectedReason}
            </p>
          </div>
        )}

        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Kết luận" value={report.isAuthentic ? "Đã xác thực" : "Không xác thực"} />
          <Info label="Vật liệu xác minh" value={report.verifiedMaterial} />
          <Info label="Xuất xứ" value={report.origin ?? "—"} />
          <Info label="Ước tính tuổi" value={report.ageEstimation ?? "—"} />
          <Info
            label="Tình trạng"
            value={report.conditionGrade ? CONDITION_GRADE_LABEL[report.conditionGrade] : "—"}
          />
          <Info label="Giá trị ước tính" value={formatVND(Number(report.estimatedValue))} />
          <Info label="Ngày kiểm định" value={formatDateTime(report.appraisedAt)} />
        </dl>

        {report.appraiserNotes && (
          <div className="rounded-lg border border-[#4e4637]/15 bg-[#f6f0e6]/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-warm">
              Ghi chú của kiểm định viên
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4e4637]">
              {report.appraiserNotes}
            </p>
          </div>
        )}

        {proofImages.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-ink-blue">Ảnh bằng chứng kiểm định</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {proofImages.map((image) => (
                <figure
                  key={image.id}
                  className="overflow-hidden rounded-lg border border-[#4e4637]/15 bg-[#f6f0e6]/40"
                >
                  {image.imageUrl ? (
                    <img
                      src={image.imageUrl}
                      alt={image.description ?? "Ảnh bằng chứng kiểm định"}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center text-muted-warm">
                      <ImageOff className="size-7" aria-hidden />
                    </div>
                  )}
                  {image.description && (
                    <figcaption className="px-3 py-2 text-xs leading-5 text-[#4e4637]">
                      {image.description}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-[#4e4637]/15 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-warm">Chữ ký số</p>
          <p className="mt-2 break-all font-mono text-xs leading-5 text-[#4e4637]">
            {report.digitalSignature}
          </p>
        </div>

        {approved && (
          <Button
            asChild
            variant="outline"
            className="border-verdigris/25 bg-white text-verdigris hover:bg-verdigris/5 hover:text-verdigris hover:border-verdigris/40 active:scale-97 transition-all cursor-pointer"
          >
            <Link
              to={`/certificates/${report.certificateCode}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" />
              Mở trang chứng thư công khai
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted-warm">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-ink-blue">{value}</dd>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center bg-warm-ivory px-6 text-center">
      <XCircle className="size-10 text-terracotta" aria-hidden />
      <h1 className="mt-4 font-serif text-xl font-bold text-ink-blue">
        Không thể tải chi tiết sản phẩm
      </h1>
      <p className="mt-2 text-sm text-muted-warm">Vui lòng kiểm tra kết nối và thử lại.</p>
      <Button type="button" onClick={onRetry} className="mt-5 bg-ink-blue text-white">
        <RefreshCw className="size-4" />
        Thử lại
      </Button>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center bg-warm-ivory px-6 text-center">
      <ImageOff className="size-10 text-muted-warm" aria-hidden />
      <h1 className="mt-4 font-serif text-xl font-bold text-ink-blue">Không tìm thấy sản phẩm</h1>
      <Button
        asChild
        variant="outline"
        className="mt-5 border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
      >
        <Link to={SELLER_PATHS.products}>
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Link>
      </Button>
    </div>
  );
}
