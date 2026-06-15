import { ImageOff } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { DisputeEvidence } from "../types";

export function DisputeEvidenceGallery({
  evidence,
  dark = false,
}: {
  evidence: DisputeEvidence[];
  dark?: boolean;
}) {
  if (evidence.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {evidence.map((item) => (
        <a
          key={item.id}
          href={item.url ?? undefined}
          target={item.url ? "_blank" : undefined}
          rel={item.url ? "noreferrer" : undefined}
          aria-label={`Mở bằng chứng ${item.originalFilename ?? item.id}`}
          className={cn(
            "group relative aspect-square min-w-0 overflow-hidden rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass/60",
            dark
              ? "border-white/10 bg-white/5 hover:border-primary/40"
              : "border-[#4e4637]/15 bg-[#F6F0E6] hover:border-brushed-brass/50",
          )}
        >
          {item.url ? (
            <img
              src={item.url}
              alt={item.originalFilename ?? "Ảnh bằng chứng tranh chấp"}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span
              className={cn(
                "flex size-full flex-col items-center justify-center gap-2 px-2 text-center text-xs",
                dark ? "text-[#a49a88]" : "text-muted-warm",
              )}
            >
              <ImageOff className="size-5" />
              Không thể tải ảnh
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
