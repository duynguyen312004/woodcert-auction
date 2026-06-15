import { cn } from "@/shared/lib/utils";

import { DISPUTE_STATUS_LABEL } from "../constants/disputeLabels";
import type { DisputeStatus } from "../types";

const STATUS_CLASS: Record<DisputeStatus, { light: string; dark: string }> = {
  OPEN: {
    light: "border-amber-500/25 bg-amber-500/10 text-amber-700",
    dark: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  },
  UNDER_REVIEW: {
    light: "border-sky-500/25 bg-sky-500/10 text-sky-700",
    dark: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  },
  RESOLVED: {
    light: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
    dark: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  },
  REJECTED: {
    light: "border-red-500/25 bg-red-500/10 text-red-700",
    dark: "border-red-400/25 bg-red-400/10 text-red-300",
  },
  CANCELED: {
    light: "border-stone-400/25 bg-stone-500/10 text-stone-600",
    dark: "border-stone-300/20 bg-stone-300/10 text-stone-300",
  },
};

export function DisputeStatusBadge({
  status,
  className,
  dark = false,
}: {
  status: DisputeStatus;
  className?: string;
  dark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        dark ? STATUS_CLASS[status].dark : STATUS_CLASS[status].light,
        className,
      )}
    >
      {DISPUTE_STATUS_LABEL[status]}
    </span>
  );
}
