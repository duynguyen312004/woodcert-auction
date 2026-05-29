import { Banknote, ChevronLeft, ChevronRight, Clock3, ReceiptText } from "lucide-react";
import { formatCurrencyVND, formatDateTime } from "@/shared/lib/format";
import type { VnPayDeposit } from "../api/wallet";

interface DepositTableProps {
  deposits: VnPayDeposit[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getStatusLabel(status: VnPayDeposit["status"]) {
  switch (status) {
    case "SUCCESS":
      return "Thành công";
    case "FAILED":
      return "Thất bại";
    default:
      return "Đang xử lý";
  }
}

function getStatusClass(status: VnPayDeposit["status"]) {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-500/10 text-emerald-400";
    case "FAILED":
      return "bg-rose-500/10 text-rose-400";
    default:
      return "bg-amber-500/10 text-amber-400";
  }
}

export function DepositTable({
  deposits,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: DepositTableProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-card p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Lịch sử nạp tiền VNPay</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Theo dõi các yêu cầu nạp tiền và trạng thái xác nhận từ VNPay.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-primary sm:flex">
          <Banknote className="h-4 w-4" />
          <span>VNPay</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="border-b border-white/10 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Mã giao dịch</th>
              <th className="px-4 py-3">Ngân hàng</th>
              <th className="px-4 py-3 text-right">Số tiền</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-b border-white/5">
                  <td className="px-4 py-4">
                    <div className="h-4 w-32 rounded bg-white/5" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-44 rounded bg-white/5" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-16 rounded bg-white/5" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="ml-auto h-4 w-24 rounded bg-white/5" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="mx-auto h-5 w-20 rounded-full bg-white/5" />
                  </td>
                </tr>
              ))
            ) : deposits.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-muted-foreground">
                    <ReceiptText className="h-8 w-8 text-primary/70" />
                    <span className="text-xs">Chưa có giao dịch nạp tiền VNPay nào.</span>
                  </div>
                </td>
              </tr>
            ) : (
              deposits.map((deposit) => (
                <tr
                  key={deposit.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/2"
                >
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{formatDateTime(deposit.paidAt ?? deposit.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs font-semibold text-foreground">
                    {deposit.txnRef}
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-foreground">
                    {deposit.vnpBankCode ?? "N/A"}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-emerald-400">
                    +{formatCurrencyVND(deposit.amount)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-3xs font-semibold ${getStatusClass(deposit.status)}`}
                    >
                      {getStatusLabel(deposit.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs">
          <span className="text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 font-semibold text-foreground hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Trước</span>
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 font-semibold text-foreground hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5"
            >
              <span>Sau</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
