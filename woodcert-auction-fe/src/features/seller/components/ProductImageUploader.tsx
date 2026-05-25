/**
 * Component upload ảnh sản phẩm cho form đăng sản phẩm của seller.
 *
 * Component quản lý preview, ảnh chính và lỗi UI; hook upload riêng thực hiện
 * flow intent -> Cloudinary -> confirm và trả về mediaId đã xác nhận.
 */
import { ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { cn } from "@/shared/lib/utils";

import {
  PRODUCT_IMAGE_ACCEPTED_TYPES,
  PRODUCT_IMAGE_MAX_FILE_SIZE_MB,
  useProductImageUpload,
} from "../hooks/useProductImageUpload";

export interface UploadedImage {
  mediaId: number;
  previewUrl: string;
  isPrimary: boolean;
  sortOrder: number;
  fileName: string;
}

interface ProductImageUploaderProps {
  images: UploadedImage[];
  onChange: Dispatch<SetStateAction<UploadedImage[]>>;
  maxImages?: number;
  error?: string;
}

type UploadingFile = {
  id: string;
  fileName: string;
  previewUrl: string;
  progress: "uploading" | "error";
  errorMessage?: string;
};

function revokeObjectPreview(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function ProductImageUploader({
  images,
  onChange,
  maxImages = 10,
  error,
}: ProductImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageUrlsRef = useRef<string[]>([]);
  const uploadingUrlsRef = useRef<string[]>([]);
  const uploadProductImageFile = useProductImageUpload();

  const canAddMore = images.length + uploading.length < maxImages;

  useEffect(() => {
    imageUrlsRef.current = images.map((image) => image.previewUrl);
  }, [images]);

  useEffect(() => {
    uploadingUrlsRef.current = uploading.map((item) => item.previewUrl);
  }, [uploading]);

  useEffect(() => {
    return () => {
      for (const url of imageUrlsRef.current) {
        revokeObjectPreview(url);
      }
      for (const url of uploadingUrlsRef.current) {
        revokeObjectPreview(url);
      }
    };
  }, []);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      const remaining = maxImages - images.length - uploading.length;
      const toProcess = fileArr.slice(0, remaining);

      for (const file of toProcess) {
        const tempId = `${Date.now()}-${Math.random()}`;
        const previewUrl = URL.createObjectURL(file);

        setUploading((prev) => [
          ...prev,
          { id: tempId, fileName: file.name, previewUrl, progress: "uploading" },
        ]);

        try {
          const mediaId = await uploadProductImageFile(file);
          onChange((prev) => [
            ...prev,
            {
              mediaId,
              previewUrl,
              isPrimary: prev.length === 0,
              sortOrder: prev.length,
              fileName: file.name,
            },
          ]);
          setUploading((prev) => prev.filter((u) => u.id !== tempId));
        } catch {
          setUploading((prev) =>
            prev.map((u) =>
              u.id === tempId ? { ...u, progress: "error", errorMessage: "Upload thất bại" } : u,
            ),
          );
        }
      }
    },
    [images.length, uploading.length, maxImages, onChange, uploadProductImageFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      void processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) void processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const setPrimary = (mediaId: number) => {
    onChange((prev) => prev.map((img) => ({ ...img, isPrimary: img.mediaId === mediaId })));
  };

  const removeImage = (mediaId: number) => {
    const removed = images.find((img) => img.mediaId === mediaId);
    if (removed) {
      revokeObjectPreview(removed.previewUrl);
    }

    onChange((prev) => {
      const filtered = prev.filter((img) => img.mediaId !== mediaId);
      const hasPrimary = filtered.some((img) => img.isPrimary);
      return filtered.map((img, i) => ({
        ...img,
        sortOrder: i,
        isPrimary: hasPrimary ? img.isPrimary : i === 0,
      }));
    });
  };

  const dismissError = (tempId: string) => {
    setUploading((prev) => {
      const item = prev.find((u) => u.id === tempId);
      if (item) {
        revokeObjectPreview(item.previewUrl);
      }
      return prev.filter((u) => u.id !== tempId);
    });
  };

  return (
    <div className="space-y-3">
      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          aria-label="Tải ảnh lên"
          className={cn(
            "w-full rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass cursor-pointer",
            isDragging
              ? "border-brushed-brass bg-brushed-brass/5"
              : error
                ? "border-red-400/60 bg-red-50/40"
                : "border-[#4e4637]/30 bg-[#F6F0E6]/30 hover:border-brushed-brass/50 hover:bg-brushed-brass/5",
          )}
        >
          <ImagePlus
            className={cn("mx-auto mb-2 size-8", error ? "text-red-400" : "text-brushed-brass/60")}
            aria-hidden
          />
          <p className="text-sm font-semibold text-ink-blue">Kéo thả hoặc nhấn để chọn ảnh</p>
          <p className="mt-1 text-xs text-muted-warm">
            JPEG, PNG, WEBP - Tối đa {PRODUCT_IMAGE_MAX_FILE_SIZE_MB}MB mỗi ảnh - Tối đa {maxImages}{" "}
            ảnh
          </p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPTED_TYPES.join(",")}
        multiple
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden
      />

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {(images.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img) => (
            <div key={img.mediaId} className="group relative aspect-square">
              <img
                src={img.previewUrl}
                alt={img.fileName}
                className={cn(
                  "size-full rounded-lg border-2 object-cover transition-all",
                  img.isPrimary
                    ? "border-brushed-brass ring-2 ring-brushed-brass/30"
                    : "border-[#4e4637]/20",
                )}
              />

              {img.isPrimary && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded bg-brushed-brass px-1.5 py-0.5 text-[10px] font-bold text-[#181612]">
                  <Star className="size-2.5 fill-current" aria-hidden />
                  Chính
                </span>
              )}

              <div className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(img.mediaId)}
                    aria-label={`Đặt ${img.fileName} làm ảnh chính`}
                    className="rounded bg-brushed-brass p-1.5 text-[#181612] transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Star className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.mediaId)}
                  aria-label={`Xóa ${img.fileName}`}
                  className="rounded bg-red-500 p-1.5 text-white transition-transform hover:scale-105 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}

          {uploading.map((item) => (
            <div key={item.id} className="relative aspect-square">
              <img
                src={item.previewUrl}
                alt={item.fileName}
                className="size-full rounded-lg border-2 border-[#4e4637]/20 object-cover opacity-50"
              />
              {item.progress === "uploading" ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                  <Loader2 className="size-6 animate-spin text-white" aria-hidden />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-red-900/50 p-1 text-center">
                  <p className="text-[10px] font-bold leading-tight text-white">
                    {item.errorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => dismissError(item.id)}
                    aria-label="Bỏ qua lỗi upload"
                    className="rounded bg-white/20 p-0.5 text-white hover:bg-white/30"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-warm">
        {images.length}/{maxImages} ảnh - Nhấn vào ảnh để đặt làm ảnh chính
      </p>
    </div>
  );
}
