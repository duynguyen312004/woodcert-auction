import { ImageIcon, Layers, Loader2, Package, Ruler, Tag, Weight } from "lucide-react";
import { Link } from "react-router";
import type { Dispatch, SetStateAction } from "react";
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";

import type { Category } from "@/features/catalog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { SELLER_PATHS } from "../constants/routes";
import type { CreateProductFormValues } from "../types";
import { ProductImageUploader, type UploadedImage } from "./ProductImageUploader";

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

type SellerProductEditorFormProps = {
  register: UseFormRegister<CreateProductFormValues>;
  handleSubmit: UseFormHandleSubmit<CreateProductFormValues>;
  onSubmit: (data: CreateProductFormValues) => Promise<void>;
  errors: FieldErrors<CreateProductFormValues>;
  categories: Category[];
  categoriesLoading: boolean;
  images: UploadedImage[];
  onImagesChange: Dispatch<SetStateAction<UploadedImage[]>>;
  imageError?: string;
  isSaving: boolean;
  isEditMode: boolean;
};

export function SellerProductEditorForm({
  register,
  handleSubmit,
  onSubmit,
  errors,
  categories,
  categoriesLoading,
  images,
  onImagesChange,
  imageError,
  isSaving,
  isEditMode,
}: SellerProductEditorFormProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-0 overflow-hidden rounded-xl border border-[#4e4637]/15 bg-white shadow-sm"
        >
          <section aria-labelledby="section-basic" className="p-8">
            <div className="mb-7 flex items-center gap-3 border-b border-[#4e4637]/10 pb-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-brushed-brass/20 bg-brushed-brass/10">
                <Tag className="size-4 text-brushed-brass" aria-hidden />
              </div>
              <h2 id="section-basic" className="font-serif text-xl font-bold text-ink-blue">
                Thông tin cơ bản
              </h2>
            </div>

            <div className="space-y-5">
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

          <section aria-labelledby="section-physical" className="p-8">
            <div className="mb-7 flex items-center gap-3 border-b border-[#4e4637]/10 pb-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-ink-blue/20 bg-ink-blue/10">
                <Package className="size-4 text-ink-blue" aria-hidden />
              </div>
              <h2 id="section-physical" className="font-serif text-xl font-bold text-ink-blue">
                Đặc tính vật lý
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

              <div className="space-y-1.5">
                <Label htmlFor="weight">
                  Khối lượng (kg){" "}
                  <span className="text-xs font-normal text-muted-warm">(tùy chọn)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="weight"
                    type="text"
                    inputMode="decimal"
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

              <div className="self-end rounded-lg border-l-4 border-ink-blue/30 bg-ink-blue/5 p-3 md:col-span-1">
                <p className="text-xs leading-relaxed text-muted-warm">
                  Thông tin vật lý giúp kiểm định viên thẩm định chính xác hơn và tăng độ tin cậy
                  cho sản phẩm.
                </p>
              </div>
            </div>
          </section>

          <div className="mx-8 h-px bg-[#4e4637]/10" />

          <section aria-labelledby="section-images" className="p-8">
            <div className="mb-7 flex items-center gap-3 border-b border-[#4e4637]/10 pb-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-verdigris/20 bg-verdigris/10">
                <ImageIcon className="size-4 text-verdigris" aria-hidden />
              </div>
              <div>
                <h2 id="section-images" className="font-serif text-xl font-bold text-ink-blue">
                  Hình ảnh sản phẩm
                </h2>
                <p className="mt-0.5 text-xs text-muted-warm">Tối thiểu 1 ảnh, tối đa 10 ảnh</p>
              </div>
            </div>

            <ProductImageUploader images={images} onChange={onImagesChange} error={imageError} />
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-[#4e4637]/10 px-8 pb-8 pt-6">
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {isEditMode ? "Cập nhật bản nháp" : "Tạo sản phẩm"}
            </Button>
            <Button
              asChild
              type="button"
              variant="outline"
              className="cursor-pointer border-[#4e4637]/20 bg-white text-ink-blue transition-all hover:border-brushed-brass/40 hover:bg-[#eae1d6]/50 hover:text-ink-blue active:scale-97"
            >
              <Link to={SELLER_PATHS.products}>Hủy</Link>
            </Button>
          </div>
        </form>
      </div>

      <SellerProductGuidance />
    </div>
  );
}

function SellerProductGuidance() {
  return (
    <aside
      className="space-y-5 lg:sticky lg:top-24 lg:col-span-4"
      aria-label="Hướng dẫn đăng sản phẩm"
    >
      <div className="overflow-hidden rounded-xl border border-[#4e4637]/15 bg-white shadow-sm">
        <div className="border-b border-[#4e4637]/10 px-6 pb-4 pt-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brushed-brass">
            Hướng dẫn
          </p>
          <h3 className="font-serif text-base font-bold text-ink-blue">Quy trình đăng sản phẩm</h3>
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
                <span className={`text-xs font-bold ${STEP_COLOR_CLASS[color].text}`}>{step}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-blue">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-warm">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-brushed-brass/20 bg-brushed-brass/5 p-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brushed-brass">Lưu ý</p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-muted-warm">
          <li>• Sản phẩm cần ít nhất 1 ảnh mới gửi được kiểm định</li>
          <li>• Sau khi gửi kiểm định, thông tin không thể chỉnh sửa</li>
          <li>• Thời gian kiểm định thường từ 3-5 ngày làm việc</li>
          <li>• Ảnh rõ nét giúp rút ngắn thời gian thẩm định</li>
        </ul>
      </div>
    </aside>
  );
}
