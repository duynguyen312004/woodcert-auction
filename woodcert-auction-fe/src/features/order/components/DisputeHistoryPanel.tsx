import { formatDateTime } from "@/shared/lib/format";

import type { DisputeCase } from "@/features/dispute";

type DisputeHistoryPanelProps = {
  disputes: DisputeCase[];
  isLoading?: boolean;
  emptyText?: string;
};

const STATUS_TEXT: Record<string, string> = {
  OPEN: "Đang mở",
  UNDER_REVIEW: "Đang xem xét",
  RESOLVED: "Đã xử lý",
  REJECTED: "Từ chối",
  CANCELED: "Đã hủy",
};

const OUTCOME_TEXT: Record<string, string> = {
  SELLER_WINS: "Seller thắng",
  BUYER_WINS: "Buyer thắng",
};

export function DisputeHistoryPanel({
  disputes,
  isLoading = false,
  emptyText = "Đơn chưa phát sinh tranh chấp.",
}: DisputeHistoryPanelProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-warm">Đang tải lịch sử tranh chấp...</p>;
  }

  if (disputes.length === 0) {
    return <p className="text-sm text-muted-warm">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {disputes.map((dispute) => (
        <article key={dispute.id} className="rounded-lg border border-[#4e4637]/10 bg-white/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-ink-blue">{dispute.reason}</p>
              <p className="mt-1 text-xs text-muted-warm">
                Mở lúc {formatDateTime(dispute.openedAt)}
              </p>
            </div>
            <span className="rounded-full border border-brushed-brass/30 bg-brushed-brass/10 px-3 py-1 text-xs font-bold text-brushed-brass">
              {STATUS_TEXT[dispute.status] ?? dispute.status}
            </span>
          </div>
          {dispute.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-warm">{dispute.description}</p>
          )}
          {dispute.resolutionOutcome && (
            <p className="mt-3 rounded-md bg-[#F6F0E6] px-3 py-2 text-sm font-semibold text-ink-blue">
              Kết quả: {OUTCOME_TEXT[dispute.resolutionOutcome] ?? dispute.resolutionOutcome}
            </p>
          )}
          {dispute.resolutionNote && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-warm">
              {dispute.resolutionNote}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
