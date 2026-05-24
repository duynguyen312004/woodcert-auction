/**
 * Trang đăng sản phẩm mới cho seller.
 *
 * Form 3 section: thông tin cơ bản, đặc tính vật lý, hình ảnh.
 * Ảnh upload qua Cloudinary (3-step flow trong ProductImageUploader).
 * Sau khi tạo thành công, seller có thể gửi kiểm định ngay hoặc để sau.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ImageIcon,
  Layers,
  Loader2,
  Package,
  Ruler,
  SendHorizonal,
  ShieldCheck,
  Tag,
  Weight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";

import { useCategories } from "@/features/catalog";
import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NotificationCard, useNotification } from "@/shared/ui/notification";

import { ProductImageUploader, type UploadedImage } from "../components/ProductImageUploader";
import { SELLER_PATHS } from "../constants/routes";
import {
  useCreateProduct,
  useSubmitAppraisal,
  useUpdateProduct,
} from "../hooks/useProductMutations";
import { useSellerProductDetail } from "../hooks/useSellerDashboard";
import { createProductSchema, type CreateProductFormValues, type ProductDetail } from "../types";

// ------- Success State -------

interface SuccessStateProps {
  productId: number;
  onSubmitAppraisal: () => void;
  isSubmitting: boolean;
}

const STEP_COLOR_CLASS = {
  "brushed-brass": {
    marker: "bg-brushed-brass/10 border-brushed-brass/20",
    text: "text-brushed-brass",
  },
  verdigris: {
    marker: "bg-verdigris/10 border-verdigris/20",
    text: "text-verdigris",
  },
  "ink-blue": {
    marker: "bg-ink-blue/10 border-ink-blue/20",
    text: "text-ink-blue",
  },
} as const;

function toProductFormValues(product: ProductDetail): CreateProductFormValues {
  return {
    categoryId: product.category?.id ?? 0,
    title: product.title,
    description: product.description ?? "",
    material: product.material ?? "",
    dimensions: product.dimensions ?? "",
    weight: product.weight != null ? String(product.weight) : "",
  };
}

function toUploadedImages(product: ProductDetail): UploadedImage[] {
  return product.images
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image, index) => ({
      mediaId: image.mediaId,
      previewUrl: image.imageUrl,
      isPrimary: image.isPrimary,
      sortOrder: index,
      fileName: `product-image-${image.id}`,
    }));
}

function SuccessState({ productId, onSubmitAppraisal, isSubmitting }: SuccessStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <section
        aria-labelledby="success-heading"
        className="w-full max-w-md animate-fade-in-up rounded-xl border border-[#4e4637]/15 bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-verdigris/20 bg-verdigris/10">
          <CheckCircle2 className="size-8 text-verdigris" aria-hidden />
        </div>

        <h2 id="success-heading" className="mt-6 font-serif text-2xl font-bold text-ink-blue">
          Sản phẩm đã được tạo
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-warm">
          Sản phẩm #{productId} đã lưu thành công. Bạn có thể gửi yêu cầu kiểm định ngay để bắt đầu
          quy trình thẩm định.
        </p>

        <div className="mt-5 rounded-lg border border-ink-blue/15 bg-ink-blue/5 p-3 text-left">
          <p className="flex items-start gap-2 text-xs text-muted-warm leading-relaxed">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-ink-blue" aria-hidden />
            Sau khi gửi kiểm định, sản phẩm sẽ chuyển sang trạng thái{" "}
            <strong className="text-ink-blue">Chờ kiểm định</strong> và không thể chỉnh sửa.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            onClick={onSubmitAppraisal}
            disabled={isSubmitting}
            className="w-full gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <SendHorizonal className="size-4" aria-hidden />
            )}
            Gửi kiểm định ngay
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(SELLER_PATHS.products)}
            className="w-full"
          >
            Để sau, xem danh sách sản phẩm
          </Button>
        </div>
      </section>
    </div>
  );
}

function BlockingState({
  icon,
  title,
  description,
}: {
  icon: "loading" | "warning";
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <section className="w-full max-w-md rounded-xl border border-[#4e4637]/15 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-ink-blue/15 bg-ink-blue/5 text-ink-blue">
          {icon === "loading" ? (
            <Loader2 className="size-7 animate-spin" aria-hidden />
          ) : (
            <AlertTriangle className="size-7" aria-hidden />
          )}
        </div>
        <h2 className="mt-5 font-serif text-xl font-bold text-ink-blue">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-warm">{description}</p>
        {icon === "warning" && (
          <Button asChild className="mt-6 bg-ink-blue text-white hover:bg-ink-blue/90">
            <Link to={SELLER_PATHS.products}>Quay lại danh sách</Link>
          </Button>
        )}
      </section>
    </div>
  );
}

// ------- Trang chính -------

export function SellerNewProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const notification = useNotification();
  const parsedProductId = productId ? Number(productId) : undefined;
  const editProductId =
    parsedProductId !== undefined && Number.isFinite(parsedProductId) ? parsedProductId : undefined;
  const isEditMode = productId !== undefined;
  const isInvalidProductId = isEditMode && editProductId === undefined;

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imageError, setImageError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [appraisalError, setAppraisalError] = useState<string | null>(null);
  const hydratedProductIdRef = useRef<number | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const productDetailQuery = useSellerProductDetail(editProductId);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const submitAppraisalMutation = useSubmitAppraisal();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      categoryId: 0,
      title: "",
      description: "",
      material: "",
      dimensions: "",
      weight: "",
    },
  });

  const productDetail = productDetailQuery.data;
  const isEditingLocked =
    isEditMode && productDetail !== undefined && productDetail.status !== "DRAFT";

  useEffect(() => {
    if (
      !productDetail ||
      productDetail.status !== "DRAFT" ||
      hydratedProductIdRef.current === productDetail.id
    ) {
      return;
    }

    hydratedProductIdRef.current = productDetail.id;
    reset(toProductFormValues(productDetail));
    setImages(toUploadedImages(productDetail));
    setImageError(undefined);
    setSubmitError(null);
  }, [productDetail, reset]);

  const onSubmit = async (data: CreateProductFormValues) => {
    if (images.length === 0) {
      setImageError("Vui lòng tải lên ít nhất 1 ảnh sản phẩm");
      return;
    }
    setImageError(undefined);
    setSubmitError(null);

    try {
      const payload = {
        categoryId: data.categoryId,
        title: data.title,
        ...(data.description && { description: data.description }),
        ...(data.material && { material: data.material }),
        ...(data.dimensions && { dimensions: data.dimensions }),
        ...(data.weight && { weight: parseFloat(data.weight) }),
        images: images.map((img) => ({
          mediaId: img.mediaId,
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder,
        })),
      };

      if (isEditMode) {
        if (!editProductId) {
          setSubmitError("Không tìm thấy mã sản phẩm cần cập nhật.");
          return;
        }

        await updateMutation.mutateAsync({ productId: editProductId, payload });
        notification.success("Đã cập nhật bản nháp sản phẩm", {
          description: data.title,
        });
        navigate(SELLER_PATHS.products);
        return;
      }

      const result = await createMutation.mutateAsync(payload);
      setCreatedProductId(result.id);
    } catch (error: unknown) {
      if (isApiError(error)) {
        setSubmitError(error.message);
      } else {
        setSubmitError(
          isEditMode
            ? "Không thể cập nhật sản phẩm. Vui lòng thử lại sau."
            : "Không thể tạo sản phẩm. Vui lòng thử lại sau.",
        );
      }
    }
  };

  const handleSubmitAppraisal = async () => {
    if (!createdProductId) return;
    setAppraisalError(null);
    try {
      await submitAppraisalMutation.mutateAsync(createdProductId);
      window.location.assign(SELLER_PATHS.products);
    } catch (error: unknown) {
      if (isApiError(error)) {
        setAppraisalError(error.message);
      } else {
        setAppraisalError("Không thể gửi yêu cầu kiểm định. Vui lòng thử lại sau.");
      }
    }
  };

  const pageTitle = isEditMode ? "Chỉnh sửa bản nháp" : "Đăng sản phẩm mới";
  const submitErrorTitle = isEditMode ? "Không thể cập nhật sản phẩm" : "Không thể tạo sản phẩm";
  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="h-[68px] sticky top-0 z-10 bg-warm-ivory/80 backdrop-blur-md border-b border-[#4e4637]/20 flex items-center gap-3 px-8 shrink-0">
        <Link
          to={SELLER_PATHS.products}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-warm hover:text-ink-blue transition-colors"
          aria-label="Quay lại danh sách sản phẩm"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Sản phẩm
        </Link>
        <ChevronRight className="size-3.5 text-muted-warm/50" aria-hidden />
        <h1 className="font-serif text-lg font-bold text-ink-blue leading-tight">{pageTitle}</h1>
      </header>

      {/* Nội dung */}
      <div className="flex-1 overflow-y-auto">
        {createdProductId && !isEditMode ? (
          <>
            {appraisalError && (
              <div className="mx-auto max-w-2xl px-8 pt-6">
                <NotificationCard
                  tone="error"
                  title="Không thể gửi kiểm định"
                  description={appraisalError}
                />
              </div>
            )}
            <SuccessState
              productId={createdProductId}
              onSubmitAppraisal={handleSubmitAppraisal}
              isSubmitting={submitAppraisalMutation.isPending}
            />
          </>
        ) : isInvalidProductId ? (
          <BlockingState
            icon="warning"
            title="Mã sản phẩm không hợp lệ"
            description="Đường dẫn chỉnh sửa không chứa mã sản phẩm hợp lệ."
          />
        ) : isEditMode && productDetailQuery.isPending ? (
          <BlockingState
            icon="loading"
            title="Đang tải bản nháp"
            description="Hệ thống đang lấy thông tin sản phẩm và ảnh đã tải lên."
          />
        ) : isEditMode && productDetailQuery.isError ? (
          <BlockingState
            icon="warning"
            title="Không thể tải sản phẩm"
            description="Vui lòng kiểm tra lại quyền truy cập hoặc thử lại sau."
          />
        ) : isEditingLocked ? (
          <BlockingState
            icon="warning"
            title="Không thể chỉnh sửa sản phẩm này"
            description="Chỉ sản phẩm ở trạng thái bản nháp mới được chỉnh sửa."
          />
        ) : (
          <div className="p-8 max-w-[1280px] mx-auto">
            {submitError && (
              <NotificationCard
                tone="error"
                title={submitErrorTitle}
                description={submitError}
                className="mb-6"
              />
            )}

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              {/* Form chính */}
              <div className="lg:col-span-8">
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  className="space-y-0 overflow-hidden rounded-xl border border-[#4e4637]/15 bg-white shadow-sm"
                >
                  {/* Section 1 — Thông tin cơ bản */}
                  <section aria-labelledby="section-basic" className="p-8">
                    <div className="mb-7 flex items-center gap-3 border-b border-[#4e4637]/10 pb-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brushed-brass/10 border border-brushed-brass/20">
                        <Tag className="size-4 text-brushed-brass" aria-hidden />
                      </div>
                      <h2 id="section-basic" className="font-serif text-xl font-bold text-ink-blue">
                        Thông tin cơ bản
                      </h2>
                    </div>

                    <div className="space-y-5">
                      {/* Tên sản phẩm */}
                      <div className="space-y-1.5">
                        <Label htmlFor="title">
                          Tên sản phẩm{" "}
                          <span className="text-red-500" aria-hidden>
                            *
                          </span>
                        </Label>
                        <Input
                          id="title"
                          placeholder="Ví dụ: Tượng gỗ trắc đỏ chạm rồng thủ công"
                          {...register("title")}
                          aria-invalid={!!errors.title}
                          aria-describedby={errors.title ? "title-error" : undefined}
                        />
                        {errors.title && (
                          <p id="title-error" className="text-sm text-red-500" role="alert">
                            {errors.title.message}
                          </p>
                        )}
                      </div>

                      {/* Danh mục */}
                      <div className="space-y-1.5">
                        <Label htmlFor="categoryId">
                          Danh mục{" "}
                          <span className="text-red-500" aria-hidden>
                            *
                          </span>
                        </Label>
                        <div className="relative">
                          <select
                            id="categoryId"
                            className="w-full appearance-none rounded-md border border-[#4e4637]/20 bg-white px-3 py-2 text-sm text-[#181612] shadow-sm transition-colors placeholder:text-muted-warm focus-visible:border-brushed-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass/35 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:text-[#181612]"
                            style={{ colorScheme: "light" }}
                            {...register("categoryId", { valueAsNumber: true })}
                            aria-invalid={!!errors.categoryId}
                            aria-describedby={errors.categoryId ? "category-error" : undefined}
                          >
                            <option value={0}>
                              {categoriesLoading ? "Đang tải danh mục..." : "-- Chọn danh mục --"}
                            </option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <Layers
                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-warm"
                            aria-hidden
                          />
                        </div>
                        {errors.categoryId && (
                          <p id="category-error" className="text-sm text-red-500" role="alert">
                            {errors.categoryId.message}
                          </p>
                        )}
                      </div>

                      {/* Mô tả */}
                      <div className="space-y-1.5">
                        <Label htmlFor="description">
                          Mô tả sản phẩm{" "}
                          <span className="text-xs font-normal text-muted-warm">(tùy chọn)</span>
                        </Label>
                        <textarea
                          id="description"
                          rows={4}
                          placeholder="Mô tả chi tiết về nguồn gốc, nghề thủ công, giá trị nghệ thuật..."
                          className="w-full resize-y rounded-md border border-[#4e4637]/20 bg-white px-3 py-2 text-sm text-[#181612] shadow-sm placeholder:text-muted-warm focus-visible:border-brushed-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass/35"
                          style={{ colorScheme: "light" }}
                          {...register("description")}
                        />
                      </div>
                    </div>
                  </section>

                  <div className="mx-8 h-px bg-[#4e4637]/10" />

                  {/* Section 2 — Đặc tính vật lý */}
                  <section aria-labelledby="section-physical" className="p-8">
                    <div className="mb-7 flex items-center gap-3 border-b border-[#4e4637]/10 pb-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-blue/10 border border-ink-blue/20">
                        <Package className="size-4 text-ink-blue" aria-hidden />
                      </div>
                      <h2
                        id="section-physical"
                        className="font-serif text-xl font-bold text-ink-blue"
                      >
                        Đặc tính vật lý
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* Chất liệu */}
                      <div className="space-y-1.5">
                        <Label htmlFor="material">
                          Chất liệu gỗ{" "}
                          <span className="text-xs font-normal text-muted-warm">(tùy chọn)</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="material"
                            placeholder="Ví dụ: Gỗ trắc đỏ, Gỗ hương..."
                            className="pr-9"
                            {...register("material")}
                            aria-invalid={!!errors.material}
                            aria-describedby={errors.material ? "material-error" : undefined}
                          />
                          <Package
                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-warm/60"
                            aria-hidden
                          />
                        </div>
                        {errors.material && (
                          <p id="material-error" className="text-sm text-red-500" role="alert">
                            {errors.material.message}
                          </p>
                        )}
                      </div>

                      {/* Kích thước */}
                      <div className="space-y-1.5">
                        <Label htmlFor="dimensions">
                          Kích thước (D×R×C){" "}
                          <span className="text-xs font-normal text-muted-warm">(tùy chọn)</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="dimensions"
                            placeholder="Ví dụ: 30×15×45 cm"
                            className="pr-9"
                            {...register("dimensions")}
                            aria-invalid={!!errors.dimensions}
                            aria-describedby={errors.dimensions ? "dimensions-error" : undefined}
                          />
                          <Ruler
                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-warm/60"
                            aria-hidden
                          />
                        </div>
                        {errors.dimensions && (
                          <p id="dimensions-error" className="text-sm text-red-500" role="alert">
                            {errors.dimensions.message}
                          </p>
                        )}
                      </div>

                      {/* Khối lượng */}
                      <div className="space-y-1.5">
                        <Label htmlFor="weight">
                          Khối lượng (kg){" "}
                          <span className="text-xs font-normal text-muted-warm">(tùy chọn)</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="weight"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0.01"
                            placeholder="Ví dụ: 2.5"
                            className="pr-9"
                            {...register("weight")}
                            aria-invalid={!!errors.weight}
                            aria-describedby={errors.weight ? "weight-error" : undefined}
                          />
                          <Weight
                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-warm/60"
                            aria-hidden
                          />
                        </div>
                        {errors.weight && (
                          <p id="weight-error" className="text-sm text-red-500" role="alert">
                            {errors.weight.message}
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg border-l-4 border-ink-blue/30 bg-ink-blue/5 p-3 md:col-span-1 self-end">
                        <p className="text-xs text-muted-warm leading-relaxed">
                          Thông tin vật lý giúp kiểm định viên thẩm định chính xác hơn và tăng độ
                          tin cậy cho sản phẩm.
                        </p>
                      </div>
                    </div>
                  </section>

                  <div className="mx-8 h-px bg-[#4e4637]/10" />

                  {/* Section 3 — Hình ảnh */}
                  <section aria-labelledby="section-images" className="p-8">
                    <div className="mb-7 flex items-center gap-3 border-b border-[#4e4637]/10 pb-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-verdigris/10 border border-verdigris/20">
                        <ImageIcon className="size-4 text-verdigris" aria-hidden />
                      </div>
                      <div>
                        <h2
                          id="section-images"
                          className="font-serif text-xl font-bold text-ink-blue"
                        >
                          Hình ảnh sản phẩm
                        </h2>
                        <p className="text-xs text-muted-warm mt-0.5">
                          Tối thiểu 1 ảnh, tối đa 10 ảnh
                        </p>
                      </div>
                    </div>

                    <ProductImageUploader images={images} onChange={setImages} error={imageError} />
                  </section>

                  {/* Footer form */}
                  <div className="flex flex-wrap items-center gap-3 border-t border-[#4e4637]/10 px-8 pb-8 pt-6">
                    <Button type="submit" disabled={isSaving} className="gap-2">
                      {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
                      {isEditMode ? "Cập nhật bản nháp" : "Tạo sản phẩm"}
                    </Button>
                    <Button asChild type="button" variant="outline">
                      <Link to={SELLER_PATHS.products}>Hủy</Link>
                    </Button>
                  </div>
                </form>
              </div>

              {/* Sidebar hướng dẫn */}
              <aside
                className="space-y-5 lg:sticky lg:top-24 lg:col-span-4"
                aria-label="Hướng dẫn đăng sản phẩm"
              >
                <div className="overflow-hidden rounded-xl border border-[#4e4637]/15 bg-white shadow-sm">
                  <div className="border-b border-[#4e4637]/10 px-6 pb-4 pt-6">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brushed-brass">
                      Hướng dẫn
                    </p>
                    <h3 className="font-serif text-base font-bold text-ink-blue">
                      Quy trình đăng sản phẩm
                    </h3>
                  </div>

                  <ol className="space-y-5 p-6">
                    {(
                      [
                        {
                          step: "1",
                          color: "brushed-brass",
                          title: "Điền thông tin",
                          desc: "Cung cấp tên, danh mục và đặc tính để kiểm định viên có đủ dữ liệu thẩm định.",
                        },
                        {
                          step: "2",
                          color: "verdigris",
                          title: "Tải ảnh chất lượng cao",
                          desc: "Tải lên ít nhất 1 ảnh rõ nét, nhiều góc chụp. Ảnh đầu tiên được đặt làm ảnh chính.",
                        },
                        {
                          step: "3",
                          color: "ink-blue",
                          title: "Gửi kiểm định",
                          desc: "Sau khi tạo, gửi sản phẩm để WoodCert thẩm định và cấp chứng nhận.",
                        },
                      ] as const
                    ).map(({ step, color, title, desc }) => (
                      <li key={step} className="flex items-start gap-4">
                        <div
                          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border ${STEP_COLOR_CLASS[color].marker}`}
                        >
                          <span className={`text-xs font-bold ${STEP_COLOR_CLASS[color].text}`}>
                            {step}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink-blue">{title}</p>
                          <p className="mt-0.5 text-xs text-muted-warm leading-relaxed">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-xl border border-brushed-brass/20 bg-brushed-brass/5 p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brushed-brass">
                    Lưu ý
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-warm leading-relaxed">
                    <li>• Sản phẩm cần ít nhất 1 ảnh mới gửi được kiểm định</li>
                    <li>• Sau khi gửi kiểm định, thông tin không thể chỉnh sửa</li>
                    <li>• Thời gian kiểm định thường từ 3–5 ngày làm việc</li>
                    <li>• Ảnh rõ nét giúp rút ngắn thời gian thẩm định</li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
