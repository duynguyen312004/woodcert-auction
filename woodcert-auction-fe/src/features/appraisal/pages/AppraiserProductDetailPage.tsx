/**
 * Trang chi tiết sản phẩm cho appraiser.
 *
 * Hiển thị thông tin sản phẩm, banner trạng thái claim và form kiểm định.
 * Form chỉ mở khi sản phẩm đang được claim bởi chính appraiser hiện tại.
 * Sản phẩm đã có report (APPRAISED/REJECTED) hiển thị kết quả read-only.
 */
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useProfile } from "@/features/account";
import { isApiError } from "@/shared/api/errors";
import { formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";
import { APPRAISER_PATHS } from "@/shared/constants/routes";

import {
  useAppraisalProductDetail,
  useClaimProduct,
  useReleaseClaimProduct,
  useSubmitAppraisalReport,
} from "../hooks/useAppraisalQueue";
import {
  appraisalFormSchema,
  CONDITION_GRADE_LABEL,
  type AppraisalFormValues,
  type AppraisalProductDetail,
  type ConditionGrade,
} from "../types";
import { ProofImageUploader, type ProofImage } from "../components/ProofImageUploader";

const CONDITION_GRADES: ConditionGrade[] = ["EXCELLENT", "GOOD", "FAIR", "POOR"];

function ClaimStatusBanner({
  product,
  currentUserId,
}: {
  product: AppraisalProductDetail;
  currentUserId: string | undefined;
}) {
  const isMyClaimActive =
    product.status === "UNDER_APPRAISAL" &&
    product.appraisalClaimedBy === currentUserId &&
    product.appraisalClaimExpiresAt &&
    new Date(product.appraisalClaimExpiresAt) > new Date();

  const isOthersClaim =
    product.status === "UNDER_APPRAISAL" && product.appraisalClaimedBy !== currentUserId;

  const isExpired =
    product.status === "UNDER_APPRAISAL" &&
    product.appraisalClaimExpiresAt &&
    new Date(product.appraisalClaimExpiresAt) <= new Date();

  if (isMyClaimActive) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-[#2E4A62]/30 bg-[#2E4A62]/5 px-4 py-3">
        <Clock className="mt-0.5 size-5 shrink-0 text-[#2E4A62]" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold text-[#2E4A62]">Bạn đang giữ sản phẩm này</p>
          <p className="mt-0.5 text-[#4e4637]">
            Hết hạn:{" "}
            {product.appraisalClaimExpiresAt
              ? new Date(product.appraisalClaimExpiresAt).toLocaleString("vi-VN")
              : "—"}
          </p>
        </div>
      </div>
    );
  }

  if (isOthersClaim) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-300/40 bg-amber-50 px-4 py-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold text-amber-700">
            Sản phẩm đang được kiểm định bởi người khác
          </p>
          <p className="mt-0.5 text-amber-600">
            Hết hạn:{" "}
            {product.appraisalClaimExpiresAt
              ? new Date(product.appraisalClaimExpiresAt).toLocaleString("vi-VN")
              : "—"}
          </p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <Clock className="mt-0.5 size-5 shrink-0 text-gray-400" aria-hidden />
        <p className="text-sm text-gray-600">
          Claim trước đó đã hết hạn. Bạn có thể nhận kiểm định sản phẩm này.
        </p>
      </div>
    );
  }

  return null;
}

function AppraisalReportCard({ product }: { product: AppraisalProductDetail }) {
  const report = product.appraisalReport;
  const isApproved = product.status === "APPRAISED";
  const proofImages = report?.proofImages ?? [];

  return (
    <div
      className={cn(
        "rounded-xl border p-6",
        isApproved ? "border-[#2F7D68]/30 bg-[#2F7D68]/5" : "border-red-300/40 bg-red-50/50",
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        {isApproved ? (
          <CheckCircle2 className="size-5 text-[#2F7D68]" aria-hidden />
        ) : (
          <XCircle className="size-5 text-red-500" aria-hidden />
        )}
        <h3 className={cn("font-semibold", isApproved ? "text-[#2F7D68]" : "text-red-600")}>
          {isApproved ? "Đã xác thực — Kết quả hợp lệ" : "Đã từ chối — Sản phẩm không hợp lệ"}
        </h3>
      </div>

      {product.rejectedReason && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="font-semibold">Lý do từ chối:</span> {product.rejectedReason}
        </div>
      )}

      {report && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-warm">Mã chứng nhận</dt>
            <dd className="font-mono font-semibold text-ink-blue">{report.certificateCode}</dd>
          </div>
          <div>
            <dt className="text-muted-warm">Vật liệu xác minh</dt>
            <dd className="font-medium text-ink-blue">{report.verifiedMaterial}</dd>
          </div>
          {report.origin && (
            <div>
              <dt className="text-muted-warm">Xuất xứ</dt>
              <dd className="font-medium text-ink-blue">{report.origin}</dd>
            </div>
          )}
          {report.ageEstimation && (
            <div>
              <dt className="text-muted-warm">Ước tính tuổi</dt>
              <dd className="font-medium text-ink-blue">{report.ageEstimation}</dd>
            </div>
          )}
          {report.conditionGrade && (
            <div>
              <dt className="text-muted-warm">Tình trạng</dt>
              <dd className="font-medium text-ink-blue">
                {CONDITION_GRADE_LABEL[report.conditionGrade]}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted-warm">Giá trị ước tính</dt>
            <dd className="font-medium text-ink-blue">
              {Number(report.estimatedValue).toLocaleString("vi-VN")} đ
            </dd>
          </div>
          <div>
            <dt className="text-muted-warm">Ngày kiểm định</dt>
            <dd className="font-medium text-ink-blue">{formatDate(report.appraisedAt)}</dd>
          </div>
          {report.sellerAccuracy != null && (
            <div>
              <dt className="text-muted-warm">Độ chính xác seller</dt>
              <dd className="font-medium text-ink-blue">
                {Number(report.sellerAccuracy).toFixed(1)}/5
              </dd>
            </div>
          )}
        </dl>
      )}
      {report?.appraiserNotes && (
        <div className="mt-4 rounded-lg border border-[#4e4637]/15 bg-white/70 p-3 text-sm">
          <p className="mb-1 font-semibold text-ink-blue">Ghi chú kiểm định</p>
          <p className="whitespace-pre-wrap leading-relaxed text-[#4e4637]">
            {report.appraiserNotes}
          </p>
        </div>
      )}
      {report?.integrityHash && (
        <div className="mt-4 rounded-lg border border-[#4e4637]/15 bg-white/70 p-3">
          <p className="mb-1 text-sm font-semibold text-ink-blue">Dấu vân tay SHA-256</p>
          <p className="break-all font-mono text-xs text-[#4e4637]">{report.integrityHash}</p>
        </div>
      )}
      {proofImages.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-ink-blue">Ảnh bằng chứng</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {proofImages.map((image) => (
              <figure
                key={image.id}
                className="overflow-hidden rounded-lg border border-[#4e4637]/15 bg-white"
              >
                {image.imageUrl ? (
                  <img
                    src={image.imageUrl}
                    alt={image.description ?? "Bằng chứng kiểm định"}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-[#f0e8d8] text-xs text-muted-warm">
                    Không có ảnh
                  </div>
                )}
                {image.description && (
                  <figcaption className="px-3 py-2 text-xs text-[#4e4637]">
                    {image.description}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppraisalForm({
  productId,
  onSuccess,
}: {
  productId: number;
  onSuccess: (status: "APPRAISED" | "REJECTED") => void;
}) {
  const notification = useNotification();
  const submitMutation = useSubmitAppraisalReport();
  const [proofImages, setProofImages] = useState<ProofImage[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<AppraisalFormValues>({
    resolver: zodResolver(appraisalFormSchema),
    defaultValues: {
      isAuthentic: true,
      verifiedMaterial: "",
      origin: "",
      ageEstimation: "",
      conditionGrade: undefined,
      estimatedValue: "",
      appraiserNotes: "",
      sellerAccuracy: "",
    },
  });

  const isAuthentic = useWatch({ control, name: "isAuthentic" });

  const onSubmit = async (values: AppraisalFormValues) => {
    try {
      await submitMutation.mutateAsync({
        productId,
        payload: {
          isAuthentic: values.isAuthentic,
          verifiedMaterial: values.verifiedMaterial,
          origin: values.origin || undefined,
          ageEstimation: values.ageEstimation || undefined,
          conditionGrade: values.conditionGrade,
          estimatedValue: Number(values.estimatedValue),
          appraiserNotes: values.appraiserNotes || undefined,
          sellerAccuracy: Number(values.sellerAccuracy),
          proofImages: proofImages.map((img) => ({
            mediaId: img.mediaId,
            description: img.description.trim() || undefined,
          })),
        },
      });

      notification.success(values.isAuthentic ? "Đã duyệt sản phẩm" : "Đã từ chối sản phẩm", {
        description: "Báo cáo kiểm định đã được lưu thành công.",
      });
      onSuccess(values.isAuthentic ? "APPRAISED" : "REJECTED");
    } catch (err) {
      const msg = isApiError(err) ? err.message : "Không thể nộp báo cáo. Vui lòng thử lại.";
      notification.error("Nộp báo cáo thất bại", { description: msg });
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-6">
      <div className="rounded-xl border border-[#4e4637]/20 bg-white p-6">
        <h3 className="mb-5 font-semibold text-ink-blue">Kết quả kiểm định</h3>

        <div className="mb-6 flex gap-4">
          <label
            className={cn(
              "flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
              isAuthentic
                ? "border-[#2F7D68] bg-[#2F7D68]/5"
                : "border-[#4e4637]/20 hover:border-[#4e4637]/40",
            )}
          >
            <input
              type="radio"
              className="sr-only"
              checked={isAuthentic}
              onChange={() => setValue("isAuthentic", true)}
            />
            <CheckCircle2
              className={cn("size-5", isAuthentic ? "text-[#2F7D68]" : "text-gray-300")}
              aria-hidden
            />
            <div>
              <p className="font-semibold text-ink-blue">Duyệt sản phẩm</p>
              <p className="text-xs text-muted-warm">Sản phẩm hợp lệ, xác thực</p>
            </div>
          </label>

          <label
            className={cn(
              "flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
              !isAuthentic
                ? "border-red-400 bg-red-50"
                : "border-[#4e4637]/20 hover:border-[#4e4637]/40",
            )}
          >
            <input
              type="radio"
              className="sr-only"
              checked={!isAuthentic}
              onChange={() => setValue("isAuthentic", false)}
            />
            <XCircle
              className={cn("size-5", !isAuthentic ? "text-red-500" : "text-gray-300")}
              aria-hidden
            />
            <div>
              <p className="font-semibold text-ink-blue">Từ chối sản phẩm</p>
              <p className="text-xs text-muted-warm">Sản phẩm không hợp lệ</p>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-ink-blue">
              Vật liệu xác minh <span className="text-red-500">*</span>
            </label>
            <input
              {...register("verifiedMaterial")}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-brushed-brass focus:ring-1 focus:ring-brushed-brass/30",
                errors.verifiedMaterial ? "border-red-400" : "border-[#4e4637]/30",
              )}
              placeholder="Ví dụ: Gỗ hương đỏ, Gỗ trắc..."
            />
            {errors.verifiedMaterial && (
              <p className="text-xs text-red-500">{errors.verifiedMaterial.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-blue">Xuất xứ</label>
            <input
              {...register("origin")}
              className="w-full rounded-lg border border-[#4e4637]/30 px-3 py-2 text-sm outline-none transition-colors focus:border-brushed-brass focus:ring-1 focus:ring-brushed-brass/30"
              placeholder="Ví dụ: Miền Trung Việt Nam"
            />
            {errors.origin && <p className="text-xs text-red-500">{errors.origin.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-blue">Ước tính tuổi</label>
            <input
              {...register("ageEstimation")}
              className="w-full rounded-lg border border-[#4e4637]/30 px-3 py-2 text-sm outline-none transition-colors focus:border-brushed-brass focus:ring-1 focus:ring-brushed-brass/30"
              placeholder="Ví dụ: 50-100 năm"
            />
            {errors.ageEstimation && (
              <p className="text-xs text-red-500">{errors.ageEstimation.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-blue">Tình trạng</label>
            <select
              {...register("conditionGrade")}
              className="w-full rounded-lg border border-[#4e4637]/30 px-3 py-2 text-sm outline-none transition-colors focus:border-brushed-brass focus:ring-1 focus:ring-brushed-brass/30"
            >
              <option value="">— Chọn tình trạng —</option>
              {CONDITION_GRADES.map((g) => (
                <option key={g} value={g}>
                  {CONDITION_GRADE_LABEL[g]}
                </option>
              ))}
            </select>
            {errors.conditionGrade && (
              <p className="text-xs text-red-500">{errors.conditionGrade.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-blue">
              Giá trị ước tính (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              {...register("estimatedValue")}
              type="number"
              min="0"
              step="1000"
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-brushed-brass focus:ring-1 focus:ring-brushed-brass/30",
                errors.estimatedValue ? "border-red-400" : "border-[#4e4637]/30",
              )}
              placeholder="0"
            />
            {errors.estimatedValue && (
              <p className="text-xs text-red-500">{errors.estimatedValue.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-blue">
              Độ chính xác seller (1-5) <span className="text-red-500">*</span>
            </label>
            <input
              {...register("sellerAccuracy")}
              type="number"
              min="1"
              max="5"
              step="0.1"
              className="w-full rounded-lg border border-[#4e4637]/30 px-3 py-2 text-sm outline-none transition-colors focus:border-brushed-brass focus:ring-1 focus:ring-brushed-brass/30"
              placeholder="3"
            />
            {errors.sellerAccuracy && (
              <p className="text-xs text-red-500">{errors.sellerAccuracy.message}</p>
            )}
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-ink-blue">
              Ghi chú kiểm định
              {!isAuthentic && <span className="ml-1 text-red-500">*</span>}
            </label>
            <textarea
              {...register("appraiserNotes")}
              rows={4}
              className={cn(
                "w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-brushed-brass focus:ring-1 focus:ring-brushed-brass/30",
                errors.appraiserNotes ? "border-red-400" : "border-[#4e4637]/30",
              )}
              placeholder={
                !isAuthentic
                  ? "Bắt buộc nhập lý do từ chối sản phẩm..."
                  : "Ghi chú thêm về kết quả kiểm định (không bắt buộc)..."
              }
            />
            {errors.appraiserNotes && (
              <p className="text-xs text-red-500">{errors.appraiserNotes.message}</p>
            )}
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-ink-blue">
              Ảnh bằng chứng kiểm định
              <span className="ml-1 text-xs font-normal text-muted-warm">(không bắt buộc)</span>
            </label>
            <ProofImageUploader images={proofImages} onChange={setProofImages} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={submitMutation.isPending}
          className={cn("gap-2", !isAuthentic && "bg-red-600 hover:bg-red-700")}
        >
          {submitMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
          {isAuthentic ? "Duyệt sản phẩm" : "Từ chối sản phẩm"}
        </Button>
      </div>
    </form>
  );
}

function ImageGallery({
  images,
  title,
}: {
  images: AppraisalProductDetail["images"];
  title: string;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const displayImage = sortedImages[selectedIdx]?.imageUrl ?? null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-[#4e4637]/20 bg-[#f0e8d8] aspect-square">
        {displayImage ? (
          <img src={displayImage} alt={title} className="size-full object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center text-[#8D877C]">
            <ShieldCheck className="size-16 opacity-30" aria-hidden />
          </div>
        )}
      </div>

      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sortedImages.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={cn(
                "size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                selectedIdx === idx
                  ? "border-brushed-brass ring-2 ring-brushed-brass/30"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
              aria-label={`Ảnh ${idx + 1}`}
            >
              <img src={img.imageUrl} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppraiserProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const notification = useNotification();
  const { data: profile } = useProfile();

  const parsedId = productId ? parseInt(productId, 10) : undefined;
  const productQuery = useAppraisalProductDetail(parsedId);
  const claimMutation = useClaimProduct();
  const releaseMutation = useReleaseClaimProduct();

  const product = productQuery.data;
  const currentUserId = profile?.id;

  const isMyClaimActive =
    product?.status === "UNDER_APPRAISAL" &&
    product?.appraisalClaimedBy === currentUserId &&
    product?.appraisalClaimExpiresAt != null &&
    new Date(product.appraisalClaimExpiresAt) > new Date();

  const isReviewed = product?.status === "APPRAISED" || product?.status === "REJECTED";

  const canClaim =
    product?.status === "PENDING_APPRAISAL" ||
    (product?.status === "UNDER_APPRAISAL" &&
      (product?.appraisalClaimExpiresAt == null ||
        new Date(product.appraisalClaimExpiresAt) <= new Date()));

  const handleClaim = async () => {
    if (!parsedId) return;
    try {
      await claimMutation.mutateAsync(parsedId);
      notification.success("Đã nhận kiểm định", {
        description: "Sản phẩm đã được giao cho bạn.",
      });
    } catch (err) {
      const msg =
        isApiError(err) && err.statusCode === 409
          ? "Sản phẩm đã được appraiser khác nhận."
          : "Không thể nhận sản phẩm. Vui lòng thử lại.";
      notification.error("Không thể nhận kiểm định", { description: msg });
    }
  };

  const handleRelease = async () => {
    if (!parsedId) return;
    try {
      await releaseMutation.mutateAsync(parsedId);
      notification.success("Đã trả về hàng chờ", {
        description: "Sản phẩm đã được trả về hàng chờ để appraiser khác có thể nhận.",
      });
      void navigate(APPRAISER_PATHS.products);
    } catch (err) {
      const msg = isApiError(err) ? err.message : "Không thể trả sản phẩm. Vui lòng thử lại.";
      notification.error("Không thể trả về hàng chờ", { description: msg });
    }
  };

  if (productQuery.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brushed-brass" aria-hidden />
        <span className="sr-only">Đang tải thông tin sản phẩm</span>
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-red-600">
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          <span className="text-sm">Không thể tải thông tin sản phẩm. Vui lòng thử lại.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => void navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-warm hover:text-ink-blue transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại
        </button>
        <h1 className="font-serif text-xl font-bold text-ink-blue line-clamp-1">{product.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <ImageGallery key={product.id} images={product.images} title={product.title} />

          <div className="rounded-xl border border-[#4e4637]/20 bg-white p-4 space-y-3 text-sm">
            <h3 className="font-semibold text-ink-blue">Thông tin sản phẩm</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-warm">Danh mục</dt>
                <dd className="font-medium text-ink-blue">{product.category?.name ?? "—"}</dd>
              </div>
              {product.material && (
                <div className="flex justify-between">
                  <dt className="text-muted-warm">Chất liệu</dt>
                  <dd className="font-medium text-ink-blue">{product.material}</dd>
                </div>
              )}
              {product.dimensions && (
                <div className="flex justify-between">
                  <dt className="text-muted-warm">Kích thước</dt>
                  <dd className="font-medium text-ink-blue">{product.dimensions}</dd>
                </div>
              )}
              {product.weight != null && (
                <div className="flex justify-between">
                  <dt className="text-muted-warm">Khối lượng</dt>
                  <dd className="font-medium text-ink-blue">{String(product.weight)} kg</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-warm">Ngày gửi</dt>
                <dd className="font-medium text-ink-blue">
                  {formatDate(product.submittedAt ?? product.createdAt)}
                </dd>
              </div>
              {product.seller && (
                <div className="flex justify-between">
                  <dt className="text-muted-warm">Người bán</dt>
                  <dd className="font-medium text-ink-blue">
                    {product.seller.storeName ?? product.seller.fullName}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {product.description && (
            <div className="rounded-xl border border-[#4e4637]/20 bg-white p-5">
              <h3 className="mb-2 font-semibold text-ink-blue">Mô tả</h3>
              <p className="text-sm leading-relaxed text-[#4e4637] whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          <ClaimStatusBanner product={product} currentUserId={currentUserId} />

          {isReviewed && <AppraisalReportCard product={product} />}

          {!isReviewed && isMyClaimActive && parsedId && (
            <>
              <AppraisalForm
                productId={parsedId}
                onSuccess={(status) =>
                  void navigate(`${APPRAISER_PATHS.reviewed}?status=${status}`)
                }
              />
              <div className="flex justify-start">
                <Button
                  variant="outline"
                  onClick={() => void handleRelease()}
                  disabled={releaseMutation.isPending}
                  className="cursor-pointer gap-2 border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                >
                  {releaseMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RotateCcw className="size-4" aria-hidden />
                  )}
                  Trả về hàng chờ
                </Button>
              </div>
            </>
          )}

          {!isReviewed && !isMyClaimActive && canClaim && (
            <div className="rounded-xl border border-[#4e4637]/20 bg-white p-6 text-center">
              <ShieldCheck className="mx-auto mb-3 size-10 text-brushed-brass/60" aria-hidden />
              <p className="mb-4 text-sm text-muted-warm">
                Nhận sản phẩm này để bắt đầu quá trình kiểm định.
              </p>
              <Button
                onClick={() => void handleClaim()}
                disabled={claimMutation.isPending}
                className="gap-2"
              >
                {claimMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <ShieldCheck className="size-4" aria-hidden />
                )}
                Bắt đầu kiểm định
              </Button>
            </div>
          )}

          {!isReviewed && !isMyClaimActive && !canClaim && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
              <p className="text-sm text-amber-700">
                Sản phẩm này đang được kiểm định bởi người khác. Vui lòng chờ hoặc chọn sản phẩm
                khác.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
