import { Link } from "react-router";

import { DISPUTE_OUTCOME_LABEL, DISPUTE_STATUS_LABEL, type DisputeCase } from "@/features/dispute";
import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";

type DisputeHistoryPanelProps = {
  disputes: DisputeCase[];
  isLoading?: boolean;
  emptyText?: string;
  getDetailPath?: (dispute: DisputeCase) => string;
};

export function DisputeHistoryPanel({
  disputes,
  isLoading = false,
  emptyText = "Đơn chưa phát sinh tranh chấp.",
  getDetailPath,
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
            <div className="min-w-0">
              <p className="break-words font-bold text-ink-blue">{dispute.reason}</p>
              <p className="mt-1 text-xs text-muted-warm">
                Mở lúc {formatDateTime(dispute.openedAt)}
              </p>
            </div>
            <span className="rounded-full border border-brushed-brass/30 bg-brushed-brass/10 px-3 py-1 text-xs font-bold text-brushed-brass">
              {DISPUTE_STATUS_LABEL[dispute.status]}
            </span>
          </div>
          {dispute.description && (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-warm">
              {dispute.description}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-warm">
            {dispute.evidence.length} ảnh bằng chứng ban đầu
          </p>
          {dispute.resolutionOutcome && (
            <p className="mt-3 rounded-md bg-[#F6F0E6] px-3 py-2 text-sm font-semibold text-ink-blue">
              Kết quả: {DISPUTE_OUTCOME_LABEL[dispute.resolutionOutcome]}
            </p>
          )}
          {dispute.resolutionNote && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-warm">
              {dispute.resolutionNote}
            </p>
          )}
          {getDetailPath && (
            <Button asChild type="button" size="sm" variant="outline" className="mt-4">
              <Link to={getDetailPath(dispute)}>Xem hồ sơ tranh chấp</Link>
            </Button>
          )}
        </article>
      ))}
    </div>
  );
}
