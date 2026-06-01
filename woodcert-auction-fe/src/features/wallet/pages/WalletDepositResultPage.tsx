import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Clock3, Loader2, RefreshCw, XCircle } from "lucide-react";
import { formatCurrencyVND, formatDateTime } from "@/shared/lib/format";
import { useDepositStatus } from "../hooks/useDepositStatus";
import { WALLET_BALANCE_QUERY_KEY } from "../hooks/useWalletBalance";
import { WALLET_TRANSACTIONS_QUERY_KEY } from "../hooks/useWalletTransactions";
import { WALLET_DEPOSITS_QUERY_KEY } from "../hooks/useDeposits";

export function WalletDepositResultPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const txnRef = searchParams.get("txnRef") || sessionStorage.getItem("last_txn_ref");
  const [timedOutTxnRef, setTimedOutTxnRef] = useState<string | null>(null);

  const { data: deposit, isError } = useDepositStatus(txnRef);
  const status = deposit?.status ?? (txnRef ? "PENDING" : null);
  const pollingTimeout = status === "PENDING" && timedOutTxnRef === txnRef;

  useEffect(() => {
    if (deposit?.status === "SUCCESS") {
      queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WALLET_TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WALLET_DEPOSITS_QUERY_KEY });
      sessionStorage.removeItem("last_txn_ref");

      // Thông báo các tab ví khác đang mở để tự cập nhật số dư
      try {
        const bc = new BroadcastChannel("wallet");
        bc.postMessage({ type: "WALLET_UPDATED" });
        bc.close();
      } catch {
        // BroadcastChannel không hỗ trợ → bỏ qua
      }
    }
  }, [deposit?.status, queryClient]);

  useEffect(() => {
    if (status === "PENDING" && txnRef) {
      const timer = setTimeout(() => {
        setTimedOutTxnRef(txnRef);
      }, 45000);
      return () => clearTimeout(timer);
    }
  }, [status, txnRef]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-[500px] px-6">
        <div className="rounded-2xl border border-white/10 bg-card p-8 text-center shadow-xl">
          {!txnRef && (
            <div className="space-y-6">
              <div className="flex justify-center text-amber-400">
                <XCircle className="h-16 w-16" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Không tìm thấy thông tin giao dịch
                </h1>
                <p className="text-xs text-muted-foreground">
                  Vui lòng quay lại ví để kiểm tra lịch sử nạp tiền hoặc tạo giao dịch mới.
                </p>
              </div>
              <Link
                to="/wallet"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                <span>Quay lại ví</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {txnRef && status === "PENDING" && !pollingTimeout && !isError && (
            <div className="space-y-4 py-6">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Đang xác nhận giao dịch...</h1>
              <p className="text-xs text-muted-foreground">
                WoodCert đang chờ IPN xác nhận từ VNPay. Số dư sẽ tự cập nhật khi giao dịch hoàn
                tất.
              </p>
            </div>
          )}

          {txnRef && status === "PENDING" && pollingTimeout && !isError && (
            <div className="space-y-6">
              <div className="flex justify-center text-amber-400">
                <Clock3 className="h-16 w-16" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Giao dịch đang xử lý lâu hơn bình thường
                </h1>
                <p className="text-xs text-muted-foreground">
                  VNPay có thể vẫn đang gửi xác nhận. Vui lòng kiểm tra lại số dư và lịch sử nạp
                  tiền sau vài phút.
                </p>
              </div>
              <DepositSummary txnRef={txnRef} amount={deposit?.amount} />
              <ResultActions retry />
            </div>
          )}

          {txnRef && status === "SUCCESS" && deposit && (
            <div className="space-y-6">
              <div className="flex justify-center text-emerald-400">
                <CheckCircle2 className="h-16 w-16" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Nạp tiền thành công</h1>
                <p className="text-xs text-muted-foreground">Số dư ví của bạn đã được cập nhật.</p>
              </div>

              <div className="space-y-3 rounded-xl border border-white/5 bg-background/50 p-4 text-left text-xs">
                <InfoLine label="Mã giao dịch" value={deposit.txnRef} mono />
                <InfoLine label="Số tiền nạp" value={formatCurrencyVND(deposit.amount)} strong />
                <InfoLine label="Ngân hàng" value={deposit.vnpBankCode ?? "N/A"} />
                <InfoLine
                  label="Thời gian nạp"
                  value={formatDateTime(deposit.paidAt ?? deposit.createdAt)}
                />
              </div>

              <Link
                to="/wallet"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                <span>Quay lại ví của tôi</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {txnRef && (status === "FAILED" || isError) && (
            <div className="space-y-6">
              <div className="flex justify-center text-rose-400">
                <XCircle className="h-16 w-16" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Nạp tiền thất bại</h1>
                <p className="text-xs text-muted-foreground">
                  Giao dịch đã bị hủy hoặc không thể xác nhận từ VNPay.
                </p>
              </div>
              <DepositSummary txnRef={txnRef} amount={deposit?.amount} />
              <ResultActions retry />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoLine({
  label,
  value,
  mono = false,
  strong = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span
        className={`text-right text-foreground ${mono ? "font-mono" : ""} ${
          strong ? "font-bold text-primary" : "font-semibold"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function DepositSummary({ txnRef, amount }: { txnRef: string; amount?: number }) {
  return (
    <div className="space-y-3 rounded-xl border border-white/5 bg-background/50 p-4 text-left text-xs">
      <InfoLine label="Mã giao dịch" value={txnRef} mono />
      {amount !== undefined && (
        <InfoLine label="Số tiền yêu cầu" value={formatCurrencyVND(amount)} />
      )}
    </div>
  );
}

function ResultActions({ retry = false }: { retry?: boolean }) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {retry && (
        <Link
          to="/wallet/deposit"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Thử lại giao dịch</span>
        </Link>
      )}
      <Link
        to="/wallet"
        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3.5 text-sm font-bold text-foreground hover:bg-white/10"
      >
        <span>Quay lại ví</span>
      </Link>
    </div>
  );
}
