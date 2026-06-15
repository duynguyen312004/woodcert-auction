import type { ReactNode } from "react";
import { CheckCircle2, MessageSquareText, ShieldAlert } from "lucide-react";

import { formatDateTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

import {
  DISPUTE_AUTHOR_LABEL,
  DISPUTE_OUTCOME_LABEL,
  DISPUTE_STATUS_LABEL,
} from "../constants/disputeLabels";
import type { DisputeDetail, DisputeMessage } from "../types";
import { DisputeEvidenceGallery } from "./DisputeEvidenceGallery";

export function DisputeTimeline({
  detail,
  dark = false,
}: {
  detail: DisputeDetail;
  dark?: boolean;
}) {
  const { dispute, messages } = detail;

  return (
    <div className="relative space-y-5 before:absolute before:bottom-4 before:left-[17px] before:top-5 before:w-px before:bg-current before:opacity-15">
      <TimelineEntry
        icon={<ShieldAlert className="size-4" />}
        label="Người mua mở tranh chấp"
        time={dispute.openedAt}
        dark={dark}
      >
        <p className="break-words font-bold">{dispute.reason}</p>
        {dispute.description && (
          <p className={cn("mt-2 whitespace-pre-wrap break-words text-sm leading-6", muted(dark))}>
            {dispute.description}
          </p>
        )}
        <DisputeEvidenceGallery evidence={dispute.evidence} dark={dark} />
      </TimelineEntry>

      {messages.length === 0 && (
        <div
          className={cn(
            "ml-10 rounded-lg border border-dashed px-4 py-5 text-sm",
            dark ? "border-white/15 text-[#a49a88]" : "border-[#4e4637]/20 text-muted-warm",
          )}
        >
          Chưa có phản hồi bổ sung trong hồ sơ này.
        </div>
      )}

      {messages.map((message) => (
        <MessageEntry key={message.id} message={message} dark={dark} />
      ))}

      {dispute.resolutionOutcome && (
        <TimelineEntry
          icon={<CheckCircle2 className="size-4" />}
          label="Quyết định cuối cùng"
          time={dispute.resolvedAt}
          dark={dark}
          tone="success"
        >
          <p className="font-bold">{DISPUTE_OUTCOME_LABEL[dispute.resolutionOutcome]}</p>
          {dispute.resolutionNote && (
            <p
              className={cn("mt-2 whitespace-pre-wrap break-words text-sm leading-6", muted(dark))}
            >
              {dispute.resolutionNote}
            </p>
          )}
        </TimelineEntry>
      )}

      {!dispute.resolutionOutcome &&
        (dispute.status === "CANCELED" || dispute.status === "REJECTED") && (
          <TimelineEntry
            icon={<CheckCircle2 className="size-4" />}
            label={DISPUTE_STATUS_LABEL[dispute.status]}
            time={dispute.resolvedAt}
            dark={dark}
          />
        )}
    </div>
  );
}

function MessageEntry({ message, dark }: { message: DisputeMessage; dark: boolean }) {
  const roleTone = dark
    ? {
        BUYER: "text-sky-300",
        SELLER: "text-amber-300",
        ADMIN: "text-emerald-300",
      }[message.authorRole]
    : {
        BUYER: "text-sky-700",
        SELLER: "text-amber-700",
        ADMIN: "text-emerald-700",
      }[message.authorRole];

  return (
    <TimelineEntry
      icon={<MessageSquareText className="size-4" />}
      label={DISPUTE_AUTHOR_LABEL[message.authorRole]}
      time={message.createdAt}
      dark={dark}
      labelClassName={roleTone}
    >
      {message.content && (
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
      )}
      <DisputeEvidenceGallery evidence={message.evidence} dark={dark} />
    </TimelineEntry>
  );
}

function TimelineEntry({
  icon,
  label,
  time,
  children,
  dark,
  tone = "default",
  labelClassName,
}: {
  icon: ReactNode;
  label: string;
  time: string | null;
  children?: ReactNode;
  dark: boolean;
  tone?: "default" | "success";
  labelClassName?: string;
}) {
  return (
    <article className="relative grid min-w-0 grid-cols-[36px_minmax(0,1fr)] gap-3">
      <div
        className={cn(
          "relative z-[1] flex size-9 items-center justify-center rounded-full border",
          tone === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
            : dark
              ? "border-white/15 bg-[#181612] text-primary"
              : "border-[#4e4637]/15 bg-white text-brushed-brass",
        )}
      >
        {icon}
      </div>
      <div
        className={cn(
          "min-w-0 rounded-lg border p-4 shadow-sm",
          dark ? "border-white/10 bg-white/[0.04] text-[#f2eee5]" : "border-[#4e4637]/12 bg-white",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn("text-sm font-bold", labelClassName)}>{label}</p>
          {time && <time className={cn("text-xs", muted(dark))}>{formatDateTime(time)}</time>}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </article>
  );
}

function muted(dark: boolean) {
  return dark ? "text-[#d2c5b2]" : "text-muted-warm";
}
