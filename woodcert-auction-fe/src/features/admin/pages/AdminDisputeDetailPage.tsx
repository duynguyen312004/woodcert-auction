import { ArrowLeft, FileWarning, Loader2, RefreshCw, ShieldCheck, Undo2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";

import {
  DISPUTE_OUTCOME_LABEL,
  DISPUTE_STATUS_LABEL,
  DisputeMessageComposer,
  DisputeStatusBadge,
  DisputeTimeline,
  isActiveDisputeStatus,
  useAdminDispute,
  useAdminDisputeMutations,
  type DisputeResolutionOutcome,
} from "@/features/dispute";
import { isApiError } from "@/shared/api/errors";
import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";

export function AdminDisputeDetailPage() {
  const { id } = useParams();
  const disputeId = id ? Number(id) : undefined;
  const validId = Number.isFinite(disputeId) ? disputeId : undefined;
  const query = useAdminDispute(validId);
  const mutations = useAdminDisputeMutations();
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionNoteError, setResolutionNoteError] = useState("");
  const notification = useNotification();
  const detail = query.data;
  const dispute = detail?.dispute;

  const resolve = async (outcome: DisputeResolutionOutcome) => {
    if (!dispute) return;
    const normalizedNote = resolutionNote.trim();
    if (!normalizedNote) {
      setResolutionNoteError("Vui lòng nhập ghi chú quyết định trước khi giải quyết.");
      return;
    }
    try {
      await mutations.resolve.mutateAsync({
        id: dispute.id,
        outcome,
        resolutionNote: normalizedNote,
      });
      notification.success("Đã giải quyết tranh chấp.");
    } catch (error) {
      notification.error("Không thể giải quyết tranh chấp", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      });
    }
  };

  if (query.isPending) {
    return <AdminDisputeSkeleton />;
  }

  if (query.isError) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#181612] p-8 text-[#f2eee5]">
        <div className="max-w-md text-center">
          <FileWarning className="mx-auto size-9 text-primary" />
          <p className="mt-4 font-bold">Không thể tải hồ sơ tranh chấp.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 border-white/15 bg-transparent text-[#f2eee5] hover:bg-white/10"
            onClick={() => void query.refetch()}
          >
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </div>
      </main>
    );
  }

  if (!detail || !dispute) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-8 text-[#d2c5b2]">
        Không tìm thấy hồ sơ tranh chấp.
      </main>
    );
  }

  const canResolve = isActiveDisputeStatus(dispute.status);
  const canSubmitResolution = canResolve && resolutionNote.trim().length > 0;

  return (
    <main className="min-h-full bg-[#181612] px-4 py-6 text-[#f2eee5] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Button
              asChild
              type="button"
              variant="outline"
              size="sm"
              className="mb-4 border-white/15 bg-transparent text-[#f2eee5] hover:bg-white/10"
            >
              <Link to="/admin/disputes">
                <ArrowLeft className="size-4" />
                Quay lại danh sách
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Hồ sơ tranh chấp #{dispute.id}
              </p>
              <DisputeStatusBadge status={dispute.status} dark />
            </div>
            <h1 className="mt-2 text-3xl font-bold">Đơn hàng #{dispute.orderId}</h1>
            <p className="mt-2 text-sm text-[#d2c5b2]">
              Mở lúc {formatDateTime(dispute.openedAt)} · {DISPUTE_STATUS_LABEL[dispute.status]}
            </p>
          </div>
        </header>

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 space-y-5">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 shadow-sm sm:p-5">
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <h2 className="font-bold">Diễn biến vụ việc</h2>
              </div>
              <DisputeTimeline detail={detail} dark />
            </div>

            {canResolve ? (
              <DisputeMessageComposer
                dark
                placeholder="Yêu cầu người mua hoặc người bán bổ sung thông tin..."
                onSubmit={(payload) => mutations.message.mutateAsync({ id: dispute.id, payload })}
              />
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-[#d2c5b2]">
                Hồ sơ đã kết thúc và chỉ còn quyền xem.
              </div>
            )}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-sm">
              <h2 className="text-lg font-bold">Quyết định</h2>
              <p className="mt-2 text-sm leading-6 text-[#a49a88]">
                Xem toàn bộ nội dung và bằng chứng trước khi chọn kết quả cuối cùng.
              </p>
              <textarea
                value={resolutionNote}
                maxLength={2000}
                onChange={(event) => {
                  setResolutionNote(event.target.value);
                  if (resolutionNoteError) setResolutionNoteError("");
                }}
                placeholder="Ghi rõ căn cứ cho quyết định"
                className="mt-4 min-h-32 w-full resize-y rounded-md border border-white/15 bg-black/20 px-3 py-2 text-sm leading-6 text-[#f2eee5] outline-none placeholder:text-[#8d877c] focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canResolve}
              />
              <div className="mt-1 flex justify-end text-xs text-[#8d877c]">
                {resolutionNote.length}/2000
              </div>
              {resolutionNoteError && (
                <p className="mt-2 text-xs font-semibold text-red-300">{resolutionNoteError}</p>
              )}
              <div className="mt-4 grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-transparent text-[#f2eee5] hover:bg-white/10"
                  disabled={
                    !canResolve || dispute.status === "UNDER_REVIEW" || mutations.review.isPending
                  }
                  onClick={async () => {
                    try {
                      await mutations.review.mutateAsync(dispute.id);
                      notification.success(
                        "Đã chuyển tranh chấp sang trạng thái đang được xem xét.",
                      );
                    } catch (error) {
                      notification.error("Không thể cập nhật trạng thái", {
                        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
                      });
                    }
                  }}
                >
                  {mutations.review.isPending && <Loader2 className="size-4 animate-spin" />}
                  <ShieldCheck className="size-4" />
                  Đánh dấu đang được xem xét
                </Button>
                <Button
                  type="button"
                  disabled={!canSubmitResolution || mutations.resolve.isPending}
                  onClick={() => void resolve("SELLER_WINS")}
                >
                  Người bán thắng - giải ngân
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!canSubmitResolution || mutations.resolve.isPending}
                  onClick={() => void resolve("BUYER_WINS")}
                >
                  <Undo2 className="size-4" />
                  Người mua thắng - hoàn tiền
                </Button>
              </div>
            </section>

            {dispute.resolutionOutcome && (
              <section className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm">
                <p className="font-bold text-emerald-300">
                  {DISPUTE_OUTCOME_LABEL[dispute.resolutionOutcome]}
                </p>
                {dispute.resolutionNote && (
                  <p className="mt-2 whitespace-pre-wrap break-words leading-6 text-[#d2c5b2]">
                    {dispute.resolutionNote}
                  </p>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function AdminDisputeSkeleton() {
  return (
    <main className="min-h-full bg-[#181612] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px] animate-pulse">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="mt-4 h-10 max-w-md rounded bg-white/10" />
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[580px] rounded-lg bg-white/5" />
          <div className="h-[420px] rounded-lg bg-white/5" />
        </div>
      </div>
    </main>
  );
}
