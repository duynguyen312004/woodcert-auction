import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { useWalletBalance } from "@/features/wallet";
import { isApiError } from "@/shared/api/errors";
import { formatVND } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

interface AppraisalSubmissionDialogProps {
  open: boolean;
  productTitle: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  onSuccess?: () => void;
}

export function AppraisalSubmissionDialog({
  open,
  productTitle,
  onOpenChange,
  onConfirm,
  onSuccess,
}: AppraisalSubmissionDialogProps) {
  const walletQuery = useWalletBalance(open);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableBalance = walletQuery.data?.availableBalance;
  const appraisalFee = walletQuery.data?.appraisalFee;
  const isWalletLoading = walletQuery.isPending;
  const hasWalletData = availableBalance !== undefined && appraisalFee !== undefined;
  const isInsufficient = hasWalletData && availableBalance < appraisalFee;
  const missingAmount = hasWalletData ? Math.max(0, appraisalFee - availableBalance) : 0;
  const remainingBalance = hasWalletData ? Math.max(0, availableBalance - appraisalFee) : 0;

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm();
      onSuccess?.();
      onOpenChange(false);
    } catch (submitError: unknown) {
      setError(
        isApiError(submitError)
          ? submitError.message
          : "Không thể gửi yêu cầu kiểm định. Vui lòng thử lại sau.",
      );
      void walletQuery.refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border-[#4e4637]/15 bg-white p-0 text-ink-blue shadow-[0_24px_80px_rgba(24,22,18,0.24)]">
        <div className="px-6 pb-5 pt-6 sm:px-7">
          <DialogHeader className="mb-0">
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-verdigris/20 bg-verdigris/10 text-verdigris">
              <ShieldCheck className="size-5" aria-hidden />
            </div>
            <DialogTitle className="text-xl text-ink-blue">Xác nhận gửi kiểm định</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-warm">
              Sản phẩm <strong className="font-semibold text-ink-blue">{productTitle}</strong> sẽ
              được chuyển vào hàng chờ kiểm định và tạm thời không thể chỉnh sửa.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 overflow-hidden rounded-xl border border-[#4e4637]/15">
            <div className="flex items-center justify-between gap-4 bg-[#f8f6f2] px-4 py-3">
              <span className="text-sm text-muted-warm">Lệ phí kiểm định</span>
              {isWalletLoading || !hasWalletData ? (
                <span className="h-5 w-24 animate-pulse rounded bg-[#4e4637]/10" />
              ) : (
                <strong className="font-mono text-sm text-ink-blue">
                  {formatVND(appraisalFee)}
                </strong>
              )}
            </div>
            <div className="grid grid-cols-2 divide-x divide-[#4e4637]/10 border-t border-[#4e4637]/10">
              <div className="p-4">
                <p className="text-xs font-semibold text-muted-warm">Số dư khả dụng</p>
                <p className="mt-1 font-mono text-sm font-bold text-ink-blue">
                  {isWalletLoading || availableBalance === undefined
                    ? "Đang tải..."
                    : formatVND(availableBalance)}
                </p>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-muted-warm">Còn lại sau thanh toán</p>
                <p className="mt-1 font-mono text-sm font-bold text-verdigris">
                  {isWalletLoading || !hasWalletData ? "Đang tải..." : formatVND(remainingBalance)}
                </p>
              </div>
            </div>
          </div>

          {walletQuery.isError ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-500/20 bg-red-50 p-4 text-left"
            >
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-700" aria-hidden />
                <div>
                  <p className="text-sm font-bold text-red-900">Không thể kiểm tra số dư ví</p>
                  <p className="mt-1 text-sm leading-5 text-red-700">
                    Vui lòng tải lại thông tin ví trước khi xác nhận thanh toán lệ phí.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void walletQuery.refetch()}
                    className="mt-3 border-red-300 bg-white text-red-700 hover:bg-red-50 hover:text-red-800"
                  >
                    Thử tải lại
                  </Button>
                </div>
              </div>
            </div>
          ) : isInsufficient ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-amber-500/25 bg-amber-50 p-4 text-left"
            >
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
                <div>
                  <p className="text-sm font-bold text-amber-900">Số dư chưa đủ</p>
                  <p className="mt-1 text-sm leading-5 text-amber-800">
                    Bạn cần nạp thêm ít nhất <strong>{formatVND(missingAmount)}</strong> để gửi sản
                    phẩm này đi kiểm định.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-3 bg-amber-700 text-white hover:bg-amber-800"
                  >
                    <Link to="/wallet/deposit" target="_blank" rel="noopener noreferrer">
                      <WalletCards className="size-4" aria-hidden />
                      Nạp tiền vào ví
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-3 rounded-xl border border-ink-blue/10 bg-ink-blue/5 p-4 text-left">
              <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-verdigris" aria-hidden />
              <p className="text-sm leading-5 text-muted-warm">
                Phí được trừ ngay khi gửi yêu cầu và không hoàn lại nếu sản phẩm bị từ chối kiểm
                định.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-0 flex-col-reverse border-t border-[#4e4637]/10 bg-[#f8f6f2] px-6 py-4 sm:flex-row sm:px-7">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="w-full border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 sm:w-auto"
          >
            Để sau
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={
              isSubmitting ||
              isWalletLoading ||
              !hasWalletData ||
              isInsufficient ||
              walletQuery.isError
            }
            className="w-full bg-ink-blue text-white hover:bg-ink-blue/90 sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ShieldCheck className="size-4" aria-hidden />
            )}
            Xác nhận và thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
