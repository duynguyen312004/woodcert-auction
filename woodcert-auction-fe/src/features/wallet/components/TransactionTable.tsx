import { useState } from "react";
import { ArrowDownCircle, CreditCard, Lock, ReceiptText, RotateCcw, Unlock } from "lucide-react";

import { formatCurrencyVND, formatDate } from "@/shared/lib/format";

import type { WalletTransaction } from "../api/wallet";

interface TransactionTableProps {
  transactions: WalletTransaction[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type FilterType = "ALL" | WalletTransaction["type"];

const FILTERS: FilterType[] = [
  "ALL",
  "WALLET_TOP_UP",
  "APPRAISAL_FEE",
  "AUCTION_DEPOSIT_FREEZE",
  "AUCTION_DEPOSIT_RELEASE",
  "AUCTION_DEPOSIT_CAPTURE",
  "ORDER_PAYMENT",
  "ORDER_REFUND",
  "SELLER_PAYOUT",
  "SELLER_FORFEIT_COMPENSATION",
];

const TYPE_LABEL: Record<WalletTransaction["type"], string> = {
  WALLET_TOP_UP: "Nạp tiền",
  APPRAISAL_FEE: "Phí thẩm định",
  AUCTION_DEPOSIT_FREEZE: "Đóng cọc",
  AUCTION_DEPOSIT_RELEASE: "Hoàn cọc",
  AUCTION_DEPOSIT_CAPTURE: "Khấu trừ cọc",
  ORDER_PAYMENT: "Thanh toán",
  ORDER_REFUND: "Hoàn tiền",
  SELLER_PAYOUT: "Tiền bán hàng",
  SELLER_FORFEIT_COMPENSATION: "Bồi thường cọc",
};

export function TransactionTable({
  transactions,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: TransactionTableProps) {
  const [filter, setFilter] = useState<FilterType>("ALL");

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "ALL") return true;
    return tx.type === filter;
  });

  return (
    <div className="rounded-xl border border-white/10 bg-card p-6 shadow-md">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="text-lg font-bold text-foreground">Lịch sử giao dịch</h3>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === type
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {type === "ALL" ? "Tất cả" : TYPE_LABEL[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="border-b border-white/10 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Mô tả</th>
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
                    <div className="h-4 w-20 rounded bg-white/5" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-40 rounded bg-white/5" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="ml-auto h-4 w-24 rounded bg-white/5" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="mx-auto h-4 w-16 rounded bg-white/5" />
                  </td>
                </tr>
              ))
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  Chưa có giao dịch nào được ghi nhận.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/2"
                  >
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <TransactionIcon type={tx.type} />
                        <span className="text-xs font-medium">{TYPE_LABEL[tx.type]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{tx.description}</td>
                    <td
                      className={`px-4 py-4 text-right text-sm font-bold ${
                        isPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatCurrencyVND(tx.amount)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-3xs font-semibold ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : tx.status === "FAILED"
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {tx.status === "SUCCESS"
                          ? "Thành công"
                          : tx.status === "FAILED"
                            ? "Thất bại"
                            : "Đang xử lý"}
                      </span>
                    </td>
                  </tr>
                );
              })
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
              className="rounded-lg bg-white/5 px-3 py-1.5 font-semibold text-foreground hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg bg-white/5 px-3 py-1.5 font-semibold text-foreground hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionIcon({ type }: { type: WalletTransaction["type"] }) {
  switch (type) {
    case "WALLET_TOP_UP":
    case "SELLER_PAYOUT":
    case "SELLER_FORFEIT_COMPENSATION":
      return <ArrowDownCircle className="h-4 w-4 text-emerald-400" />;
    case "AUCTION_DEPOSIT_FREEZE":
      return <Lock className="h-4 w-4 text-sky-400" />;
    case "AUCTION_DEPOSIT_RELEASE":
      return <Unlock className="h-4 w-4 text-emerald-400" />;
    case "ORDER_PAYMENT":
    case "AUCTION_DEPOSIT_CAPTURE":
      return <CreditCard className="h-4 w-4 text-amber-400" />;
    case "ORDER_REFUND":
      return <RotateCcw className="h-4 w-4 text-emerald-400" />;
    case "APPRAISAL_FEE":
      return <ReceiptText className="h-4 w-4 text-rose-400" />;
  }
}
