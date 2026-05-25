/**
 * Component upload anh bang chung kiem dinh.
 */
import { ImagePlus, Loader2, X } from "lucide-react";
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
  PROOF_IMAGE_ACCEPTED_TYPES,
  PROOF_IMAGE_MAX_MB,
  useProofImageUpload,
} from "../hooks/useProofImageUpload";

export interface ProofImage {
  mediaId: number;
  previewUrl: string;
  fileName: string;
  description: string;
}

interface ProofImageUploaderProps {
  images: ProofImage[];
  onChange: Dispatch<SetStateAction<ProofImage[]>>;
  maxImages?: number;
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

export function ProofImageUploader({ images, onChange, maxImages = 5 }: ProofImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageUrlsRef = useRef<string[]>([]);
  const uploadingUrlsRef = useRef<string[]>([]);
  const uploadProofImageFile = useProofImageUpload();

  const canAddMore = images.length + uploading.length < maxImages;

  useEffect(() => {
    imageUrlsRef.current = images.map((img) => img.previewUrl);
  }, [images]);

  useEffect(() => {
    uploadingUrlsRef.current = uploading.map((item) => item.previewUrl);
  }, [uploading]);

  useEffect(() => {
    return () => {
      for (const url of imageUrlsRef.current) revokeObjectPreview(url);
      for (const url of uploadingUrlsRef.current) revokeObjectPreview(url);
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
          const mediaId = await uploadProofImageFile(file);
          onChange((prev) => [
            ...prev,
            { mediaId, previewUrl, fileName: file.name, description: "" },
          ]);
          setUploading((prev) => prev.filter((u) => u.id !== tempId));
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Upload thất bại";
          setUploading((prev) =>
            prev.map((u) => (u.id === tempId ? { ...u, progress: "error", errorMessage } : u)),
          );
        }
      }
    },
    [images.length, uploading.length, maxImages, onChange, uploadProofImageFile],
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

  const removeImage = (mediaId: number) => {
    const removed = images.find((img) => img.mediaId === mediaId);
    if (removed) revokeObjectPreview(removed.previewUrl);
    onChange((prev) => prev.filter((img) => img.mediaId !== mediaId));
  };

  const updateDescription = (mediaId: number, description: string) => {
    onChange((prev) =>
      prev.map((img) => (img.mediaId === mediaId ? { ...img, description } : img)),
    );
  };

  const dismissError = (tempId: string) => {
    setUploading((prev) => {
      const item = prev.find((u) => u.id === tempId);
      if (item) revokeObjectPreview(item.previewUrl);
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
          aria-label="Tải ảnh bằng chứng lên"
          className={cn(
            "w-full rounded-xl border-2 border-dashed px-6 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass",
            isDragging
              ? "border-brushed-brass bg-brushed-brass/5"
              : "border-[#4e4637]/30 bg-[#F6F0E6]/30 hover:border-brushed-brass/50 hover:bg-brushed-brass/5",
          )}
        >
          <ImagePlus className="mx-auto mb-2 size-7 text-brushed-brass/60" aria-hidden />
          <p className="text-sm font-semibold text-ink-blue">Kéo thả hoặc nhấn để chọn ảnh</p>
          <p className="mt-1 text-xs text-muted-warm">
            JPEG, PNG, WEBP - tối đa {PROOF_IMAGE_MAX_MB}MB - tối đa {maxImages} ảnh
          </p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={PROOF_IMAGE_ACCEPTED_TYPES.join(",")}
        multiple
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden
      />

      {(images.length > 0 || uploading.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {images.map((img) => (
            <div
              key={img.mediaId}
              className="rounded-lg border border-[#4e4637]/20 bg-white p-2 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="size-20 shrink-0 overflow-hidden rounded-md bg-[#f0e8d8]">
                  <img src={img.previewUrl} alt={img.fileName} className="size-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-ink-blue">{img.fileName}</p>
                    <button
                      type="button"
                      onClick={() => removeImage(img.mediaId)}
                      aria-label={`Xoa ${img.fileName}`}
                      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  <input
                    value={img.description}
                    onChange={(event) => updateDescription(img.mediaId, event.target.value)}
                    maxLength={255}
                    placeholder="Mô tả bằng chứng"
                    className="w-full rounded-md border border-[#4e4637]/20 px-2 py-1.5 text-xs outline-none transition-colors focus:border-brushed-brass focus:ring-1 focus:ring-brushed-brass/30"
                  />
                </div>
              </div>
            </div>
          ))}

          {uploading.map((item) => (
            <div
              key={item.id}
              className="relative min-h-24 rounded-lg border border-[#4e4637]/20 bg-white p-2"
            >
              <img
                src={item.previewUrl}
                alt={item.fileName}
                className="size-20 rounded-md object-cover opacity-50"
              />
              {item.progress === "uploading" ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                  <Loader2 className="size-5 animate-spin text-white" aria-hidden />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-red-900/60 p-1 text-center">
                  <p className="text-[10px] font-bold leading-tight text-white">
                    {item.errorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => dismissError(item.id)}
                    aria-label="Bỏ qua lỗi"
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
        {images.length}/{maxImages} ảnh bằng chứng
      </p>
    </div>
  );
}
