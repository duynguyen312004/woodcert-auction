import { useState } from "react";
import { CheckCircle2, Gavel, Info, PlusCircle, ShieldAlert, Wallet } from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { cn } from "@/shared/lib/utils";
import type { BiddingAuctionDetail, ParticipationStatus } from "../types";

interface BidControlPanelProps {
  detail: BiddingAuctionDetail;
  participation: ParticipationStatus | null;
  isPlacingBid: boolean;
  isRegistering: boolean;
  onPlaceBid: (amount: number) => Promise<unknown>;
  onRegister: () => Promise<unknown>;
  walletBalance: number;
  className?: string;
}

export function BidControlPanel({
  detail,
  participation,
  isPlacingBid,
  isRegistering,
  onPlaceBid,
  onRegister,
  walletBalance,
  className,
}: BidControlPanelProps) {
  const currentPrice = detail.currentPrice;
  const stepPrice = detail.stepPrice;
  const minBid = currentPrice + stepPrice;

  const [prevMinBid, setPrevMinBid] = useState(minBid);
  const [bidAmountInput, setBidAmountInput] = useState<string>(minBid.toString());
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  if (minBid !== prevMinBid) {
    setPrevMinBid(minBid);
    setBidAmountInput(minBid.toString());
    setErrorText(null);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const handleQuickBid = (steps: number) => {
    const targetAmount = currentPrice + stepPrice * steps;
    setBidAmountInput(targetAmount.toString());
    setErrorText(null);
  };

  const validateBid = (value: string): number | null => {
    const amount = Number(value);
    if (!value || Number.isNaN(amount)) {
      setErrorText("Vui lòng nhập một số tiền hợp lệ.");
      return null;
    }
    if (amount < minBid) {
      setErrorText(`Số tiền tối thiểu phải là ${formatCurrency(minBid)}.`);
      return null;
    }
    if ((amount - currentPrice) % stepPrice !== 0) {
      setErrorText(`Số tiền tăng thêm phải là bội số của bước giá ${formatCurrency(stepPrice)}.`);
      return null;
    }
    setErrorText(null);
    return amount;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBidAmountInput(val);
    if (val) {
      validateBid(val);
    } else {
      setErrorText(null);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const validatedAmount = validateBid(bidAmountInput);
    if (!validatedAmount) return;

    try {
      setSuccessText(null);
      await onPlaceBid(validatedAmount);
      setSuccessText("Đặt giá thành công. Bạn đang tạm dẫn đầu.");
      setBidAmountInput((validatedAmount + stepPrice).toString());
      window.setTimeout(() => setSuccessText(null), 3000);
    } catch (err: unknown) {
      const errMsg = isApiError(err)
        ? err.message
        : err instanceof Error
          ? err.message
          : "Đặt giá thất bại. Vui lòng thử lại.";
      setErrorText(errMsg);
    }
  };

  const handleRegisterConfirm = async () => {
    try {
      await onRegister();
      setShowRegisterModal(false);
    } catch (err: unknown) {
      const errMsg = isApiError(err)
        ? err.message
        : err instanceof Error
          ? err.message
          : "Đăng ký ký quỹ thất bại.";
      setShowRegisterModal(false);
      setErrorText(errMsg);
    }
  };

  const getBidDisabledReason = () => {
    if (!participation) return "Đang tải dữ liệu tham gia...";
    if (participation.sellerOwned) return "Bạn là chủ sở hữu của phiên đấu giá này.";
    if (!participation.registered) return "Bạn chưa đăng ký ký quỹ cho phiên đấu giá này.";
    if (detail.status !== "ACTIVE") return "Phiên đấu giá đang không diễn ra.";
    if (participation.highestBidder) {
      return "Bạn đang giữ giá cao nhất. Bạn chỉ có thể đặt tiếp khi có người khác vượt giá.";
    }
    if (!participation.canBid) {
      return participation.reasonMessage || "Bạn không đủ điều kiện đặt giá.";
    }
    return null;
  };

  const bidDisabledReason = getBidDisabledReason();
  const isBidInputDisabled = Boolean(bidDisabledReason) || isPlacingBid;

  return (
    <div
      className={cn(
        "flex h-full w-[320px] flex-col border-l bg-card shrink-0 p-4 overflow-y-auto",
        className,
      )}
    >
      <div className="mb-5 rounded-xl border bg-muted/40 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span>Số dư ví của bạn:</span>
          </div>
          <span className="text-xs font-bold text-foreground">{formatCurrency(walletBalance)}</span>
        </div>
        <a
          href="/wallet/deposit"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-brushed-brass/30 bg-brushed-brass/10 px-3 py-2 text-xs font-bold text-brushed-brass transition-colors hover:bg-brushed-brass/15"
        >
          <PlusCircle className="h-3.5 w-3.5" aria-hidden />
          Nạp thêm ví
        </a>
      </div>

      {!participation?.registered && !participation?.sellerOwned ? (
        <div className="flex flex-col gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <div className="mx-auto rounded-full bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground mb-1">Yêu cầu đăng ký ký quỹ</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Bạn cần ký quỹ trước số tiền{" "}
              <strong className="text-foreground font-semibold">
                {formatCurrency(detail.depositAmount)}
              </strong>{" "}
              để tham gia đặt giá trong phiên này.
            </p>
          </div>
          <button
            onClick={() => setShowRegisterModal(true)}
            disabled={isRegistering || walletBalance < detail.depositAmount}
            className="rounded-lg bg-amber-600 dark:bg-amber-500 text-white py-2 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegistering ? "Đang xử lý..." : "Đăng ký ký quỹ ngay"}
          </button>
          {walletBalance < detail.depositAmount && (
            <span className="text-[10px] text-destructive">Số dư ví không đủ để nộp tiền cọc.</span>
          )}
          {errorText && (
            <div className="flex items-start gap-1.5 rounded-lg bg-destructive/5 border border-destructive/10 p-2.5 text-[11px] text-destructive leading-normal">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmitBid} className="flex flex-col gap-4">
          {participation?.highestBidder && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-[11px] leading-normal text-emerald-600 dark:text-emerald-400">
              Bạn đang là người dẫn đầu. Hệ thống sẽ mở lại form đặt giá nếu có người khác vượt bạn.
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5 block">
              Đặt giá của bạn
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                đ
              </span>
              <input
                type="number"
                disabled={isBidInputDisabled}
                value={bidAmountInput}
                onChange={handleInputChange}
                className="w-full rounded-lg border bg-background py-2 pl-7 pr-3 text-sm font-semibold tracking-tight tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-55 disabled:cursor-not-allowed"
                placeholder={minBid.toString()}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Mức đặt tối thiểu:</span>
              <span className="font-semibold text-foreground">{formatCurrency(minBid)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 5].map((steps) => (
              <button
                key={steps}
                type="button"
                disabled={isBidInputDisabled}
                onClick={() => handleQuickBid(steps)}
                className="rounded-lg border bg-background py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +{steps} bước
              </button>
            ))}
          </div>

          {errorText && (
            <div className="flex items-start gap-1.5 rounded-lg bg-destructive/5 border border-destructive/10 p-2.5 text-[11px] text-destructive leading-normal">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          {successText && (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>{successText}</span>
            </div>
          )}

          {bidDisabledReason ? (
            <div className="rounded-lg border bg-muted/40 p-3 text-[11px] text-muted-foreground leading-normal text-center">
              {bidDisabledReason}
            </div>
          ) : (
            <button
              type="submit"
              disabled={isPlacingBid}
              className="flex items-center justify-center gap-2 rounded-lg bg-foreground text-background py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Gavel className="h-4 w-4" />
              {isPlacingBid ? "Đang gửi lượt đặt giá..." : "Đặt giá"}
            </button>
          )}
        </form>
      )}

      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-foreground mb-2">Xác nhận ký quỹ đấu giá</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Bạn có đồng ý tạm khóa số tiền{" "}
              <strong className="text-foreground">{formatCurrency(detail.depositAmount)}</strong> từ
              số dư ví để tham gia đấu giá? Số tiền này sẽ được hoàn trả nếu bạn không thắng phiên.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRegisterConfirm}
                disabled={isRegistering}
                className="rounded-lg bg-amber-600 dark:bg-amber-500 text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                {isRegistering ? "Đang xử lý..." : "Xác nhận ký quỹ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
