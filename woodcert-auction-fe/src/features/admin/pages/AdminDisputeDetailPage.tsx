import { useState } from "react";
import { useParams } from "react-router";
import { Loader2, ShieldCheck, Undo2 } from "lucide-react";

import {
  useAdminDispute,
  useAdminDisputeMutations,
  type DisputeResolutionOutcome,
} from "@/features/dispute";
import { isApiError } from "@/shared/api/errors";
import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";

import { DISPUTE_OUTCOME_LABEL, DISPUTE_STATUS_LABEL } from "../lib/dispute-labels";

export function AdminDisputeDetailPage() {
  const { id } = useParams();
  const disputeId = id ? Number(id) : undefined;
  const query = useAdminDispute(Number.isFinite(disputeId) ? disputeId : undefined);
  const mutations = useAdminDisputeMutations();
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionNoteError, setResolutionNoteError] = useState("");
  const notification = useNotification();
  const dispute = query.data;

  const resolve = async (outcome: DisputeResolutionOutcome) => {
    if (!dispute) return;
    const normalizedNote = resolutionNote.trim();
    if (!normalizedNote) {
      setResolutionNoteError("Vui lòng nhập decision note trước khi resolve.");
      return;
    }
    try {
      await mutations.resolve.mutateAsync({
        id: dispute.id,
        outcome,
        resolutionNote: normalizedNote,
      });
      notification.success("Đã xử lý tranh chấp");
    } catch (error) {
      notification.error("Không thể xử lý tranh chấp", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      });
    }
  };

  if (query.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!dispute) {
    return <main className="p-8 text-[#d2c5b2]">Không tìm thấy tranh chấp.</main>;
  }

  const canResolve = dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW";
  const canSubmitResolution = canResolve && resolutionNote.trim().length > 0;

  return (
    <main className="px-8 py-8">
      <header className="border-b border-white/10 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Dispute #{dispute.id}
        </p>
        <h1 className="mt-1 text-3xl font-bold">Đơn #{dispute.orderId}</h1>
        <p className="mt-2 text-sm text-[#d2c5b2]">
          Mở lúc {formatDateTime(dispute.openedAt)} · trạng thái{" "}
          {DISPUTE_STATUS_LABEL[dispute.status] ?? dispute.status}
        </p>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-white/10 bg-card p-5 text-foreground">
          <h2 className="text-lg font-bold text-[#f2eee5]">Nội dung khiếu nại</h2>
          <p className="mt-4 font-semibold">{dispute.reason}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[#a49a88]">
            {dispute.description ?? "Không có mô tả."}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {dispute.evidence.map((item) => (
              <a
                key={item.id}
                href={item.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-md border border-white/10 bg-white/5"
              >
                {item.url ? (
                  <img
                    src={item.url}
                    alt={item.originalFilename ?? "Evidence"}
                    className="h-56 w-full object-cover opacity-90 transition-opacity hover:opacity-100"
                  />
                ) : (
                  <div className="p-6 text-[#a49a88]">Không có ảnh</div>
                )}
              </a>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-white/10 bg-card p-5 text-foreground">
          <h2 className="text-lg font-bold text-[#f2eee5]">Quyết định</h2>
          <textarea
            value={resolutionNote}
            onChange={(event) => {
              setResolutionNote(event.target.value);
              if (resolutionNoteError) setResolutionNoteError("");
            }}
            placeholder="Decision note bắt buộc khi resolve"
            className="mt-4 min-h-32 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-[#a49a88] outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            disabled={!canResolve}
          />
          {resolutionNoteError ? (
            <p className="mt-2 text-xs font-semibold text-red-300">{resolutionNoteError}</p>
          ) : null}
          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 hover:bg-white/5"
              disabled={!canResolve || mutations.review.isPending}
              onClick={() => void mutations.review.mutateAsync(dispute.id)}
            >
              <ShieldCheck className="h-4 w-4" />
              Đánh dấu đang xử lý
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/95"
              disabled={!canSubmitResolution || mutations.resolve.isPending}
              onClick={() => void resolve("SELLER_WINS")}
            >
              Seller thắng · hoàn tất payout
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!canSubmitResolution || mutations.resolve.isPending}
              onClick={() => void resolve("BUYER_WINS")}
            >
              <Undo2 className="h-4 w-4" />
              Buyer thắng · refund
            </Button>
          </div>
          {dispute.resolutionOutcome && (
            <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm">
              <p className="font-semibold text-primary">
                Kết quả:{" "}
                {DISPUTE_OUTCOME_LABEL[dispute.resolutionOutcome] ?? dispute.resolutionOutcome}
              </p>
              {dispute.resolutionNote ? (
                <p className="mt-2 whitespace-pre-wrap text-[#d2c5b2]">{dispute.resolutionNote}</p>
              ) : null}
              {dispute.resolvedAt ? (
                <p className="mt-2 text-xs text-[#a49a88]">
                  Resolve lúc {formatDateTime(dispute.resolvedAt)}
                </p>
              ) : null}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
