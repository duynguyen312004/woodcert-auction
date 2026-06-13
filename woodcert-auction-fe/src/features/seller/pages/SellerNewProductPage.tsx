import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";

import { useCategories } from "@/features/catalog";
import { isApiError } from "@/shared/api/errors";
import { NotificationCard, useNotification } from "@/shared/ui/notification";

import { AppraisalSubmissionDialog } from "../components/AppraisalSubmissionDialog";
import type { UploadedImage } from "../components/ProductImageUploader";
import { SellerProductEditorForm } from "../components/SellerProductEditorForm";
import {
  SellerProductBlockingState,
  SellerProductSuccessState,
} from "../components/SellerProductEditorStates";
import { toProductFormValues, toUploadedImages } from "../components/sellerProductFormMappers";
import { SELLER_PATHS } from "../constants/routes";
import {
  useCreateProduct,
  useSubmitAppraisal,
  useUpdateProduct,
} from "../hooks/useProductMutations";
import { useSellerProductDetail } from "../hooks/useSellerDashboard";
import { createProductSchema, type CreateProductFormValues } from "../types";

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
  const [createdProductTitle, setCreatedProductTitle] = useState("");
  const [appraisalDialogOpen, setAppraisalDialogOpen] = useState(false);
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
      setCreatedProductTitle(payload.title);
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
    await submitAppraisalMutation.mutateAsync(createdProductId);
  };

  const pageTitle = isEditMode ? "Chỉnh sửa bản nháp" : "Đăng sản phẩm mới";
  const submitErrorTitle = isEditMode ? "Không thể cập nhật sản phẩm" : "Không thể tạo sản phẩm";
  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-[68px] shrink-0 items-center gap-3 border-b border-[#4e4637]/20 bg-warm-ivory/80 px-8 backdrop-blur-md">
        <Link
          to={SELLER_PATHS.products}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#4e4637]/15 bg-white text-muted-warm transition-all duration-300 hover:border-brushed-brass/50 hover:bg-brushed-brass/10 hover:text-brushed-brass active:scale-95"
          title="Quay lại danh sách sản phẩm"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-serif text-xl font-bold leading-tight text-ink-blue">{pageTitle}</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {createdProductId && !isEditMode ? (
          <SellerProductSuccessState
            productId={createdProductId}
            onSubmitAppraisal={() => setAppraisalDialogOpen(true)}
            isSubmitting={false}
          />
        ) : isInvalidProductId ? (
          <SellerProductBlockingState
            icon="warning"
            title="Mã sản phẩm không hợp lệ"
            description="Đường dẫn chỉnh sửa không chứa mã sản phẩm hợp lệ."
          />
        ) : isEditMode && productDetailQuery.isPending ? (
          <SellerProductBlockingState
            icon="loading"
            title="Đang tải bản nháp"
            description="Hệ thống đang lấy thông tin sản phẩm và ảnh đã tải lên."
          />
        ) : isEditMode && productDetailQuery.isError ? (
          <SellerProductBlockingState
            icon="warning"
            title="Không thể tải sản phẩm"
            description="Vui lòng kiểm tra lại quyền truy cập hoặc thử lại sau."
          />
        ) : isEditingLocked ? (
          <SellerProductBlockingState
            icon="warning"
            title="Không thể chỉnh sửa sản phẩm này"
            description="Chỉ sản phẩm ở trạng thái bản nháp mới được chỉnh sửa."
          />
        ) : (
          <div className="mx-auto max-w-[1280px] p-8">
            {submitError && (
              <NotificationCard
                tone="error"
                title={submitErrorTitle}
                description={submitError}
                className="mb-6"
              />
            )}

            <SellerProductEditorForm
              register={register}
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
              errors={errors}
              categories={categories}
              categoriesLoading={categoriesLoading}
              images={images}
              onImagesChange={setImages}
              imageError={imageError}
              isSaving={isSaving}
              isEditMode={isEditMode}
            />
          </div>
        )}
      </div>

      <AppraisalSubmissionDialog
        open={appraisalDialogOpen}
        productTitle={createdProductTitle}
        onOpenChange={setAppraisalDialogOpen}
        onConfirm={handleSubmitAppraisal}
        onSuccess={() => window.location.assign(SELLER_PATHS.products)}
      />
    </div>
  );
}
