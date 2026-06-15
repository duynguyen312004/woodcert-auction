import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { isApiError } from "@/shared/api/errors";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";

import { disputeApi } from "../api/disputeApi";
import type { CreateDisputeMessagePayload } from "../types";

export const DISPUTE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export function DisputeMessageComposer({
  onSubmit,
  dark = false,
  placeholder = "Nhập nội dung phản hồi hoặc yêu cầu bổ sung...",
}: {
  onSubmit: (payload: CreateDisputeMessagePayload) => Promise<unknown>;
  dark?: boolean;
  placeholder?: string;
}) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const notification = useNotification();
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [previews],
  );

  const addFiles = (nextFiles: File[]) => {
    const images = nextFiles.filter(
      (file) => file.type.startsWith("image/") && file.size <= DISPUTE_IMAGE_MAX_BYTES,
    );
    const invalidCount = nextFiles.length - images.length;
    const merged = [...files, ...images].slice(0, 10);
    setFiles(merged);
    if (invalidCount > 0) {
      notification.warning("Một số tệp không được thêm.", {
        description: "Chỉ chấp nhận ảnh có dung lượng tối đa 10 MB mỗi tệp.",
      });
    }
    if (files.length + images.length > 10) {
      notification.warning("Chỉ được đính kèm tối đa 10 ảnh cho mỗi phản hồi.");
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    const normalizedContent = content.trim();
    if (!normalizedContent && files.length === 0) {
      notification.error("Vui lòng nhập nội dung hoặc đính kèm ít nhất một ảnh.");
      return;
    }

    setSubmitting(true);
    let currentStep = "tải ảnh";
    try {
      const evidenceMediaIds: number[] = [];
      for (const [index, file] of files.entries()) {
        setUploadProgress(`Đang tải ảnh ${index + 1}/${files.length}`);
        evidenceMediaIds.push(await disputeApi.uploadEvidence(file));
      }
      currentStep = "gửi phản hồi";
      setUploadProgress("Đang gửi phản hồi");
      await onSubmit({
        content: normalizedContent || undefined,
        evidenceMediaIds,
      });
      setContent("");
      setFiles([]);
      notification.success("Đã gửi phản hồi vào hồ sơ tranh chấp.");
    } catch (error) {
      notification.error(`Không thể ${currentStep}`, {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      });
    } finally {
      setUploadProgress(null);
      setSubmitting(false);
    }
  };

  return (
    <section
      className={cn(
        "rounded-lg border p-4 shadow-sm",
        dark ? "border-white/10 bg-white/[0.04]" : "border-[#4e4637]/15 bg-white",
      )}
    >
      <label
        htmlFor="dispute-message"
        className={cn("text-sm font-bold", dark ? "text-[#f2eee5]" : "text-ink-blue")}
      >
        Thêm phản hồi
      </label>
      <textarea
        id="dispute-message"
        value={content}
        maxLength={2000}
        disabled={isSubmitting}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "mt-3 min-h-28 w-full resize-y rounded-md border px-3 py-2 text-sm leading-6 outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
          dark
            ? "border-white/15 bg-black/20 text-[#f2eee5] placeholder:text-[#8d877c] focus:border-primary/50 focus:ring-primary/20"
            : "border-[#4e4637]/20 bg-[#fffdf8] text-[#181612] placeholder:text-muted-warm focus:border-brushed-brass/60 focus:ring-brushed-brass/15",
        )}
      />
      <div className="mt-1 flex justify-end">
        <span className={cn("text-xs tabular-nums", dark ? "text-[#8d877c]" : "text-muted-warm")}>
          {content.length}/2000
        </span>
      </div>

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map(({ file, url }, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className="relative aspect-square"
            >
              <img src={url} alt={file.name} className="size-full rounded-md object-cover" />
              <button
                type="button"
                aria-label={`Bỏ ảnh ${file.name}`}
                disabled={isSubmitting}
                onClick={() => setFiles((current) => current.filter((_, item) => item !== index))}
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-black/75 text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <input
            ref={inputRef}
            id="dispute-message-images"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isSubmitting || files.length >= 10}
            onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
            className="sr-only"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || files.length >= 10}
            onClick={() => inputRef.current?.click()}
            className={
              dark ? "border-white/15 bg-transparent text-[#f2eee5] hover:bg-white/10" : ""
            }
          >
            <ImagePlus className="size-4" />
            Thêm ảnh ({files.length}/10)
          </Button>
        </div>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => void submit()}
          className="min-w-32"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {uploadProgress ?? "Gửi phản hồi"}
        </Button>
      </div>
    </section>
  );
}
