import { useState } from "react";
import { ArrowDownCircle, ArrowUpRight, CreditCard, Lock, Unlock } from "lucide-react";
import { formatCurrencyVND, formatDate } from "@/shared/lib/format";
import type { WalletTransaction } from "../api/wallet";

interface TransactionTableProps {
  transactions: WalletTransaction[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type FilterType = "ALL" | "DEPOSIT" | "FREEZE" | "UNFREEZE" | "PAYMENT";

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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <ArrowDownCircle className="h-4 w-4 text-emerald-400" />;
      case "FREEZE":
        return <Lock className="h-4 w-4 text-sky-400" />;
      case "UNFREEZE":
        return <Unlock className="h-4 w-4 text-emerald-400" />;
      case "PAYMENT":
        return <CreditCard className="h-4 w-4 text-amber-400" />;
      case "WITHDRAW":
        return <ArrowUpRight className="h-4 w-4 text-rose-400" />;
      default:
        return null;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "Nạp tiền";
      case "FREEZE":
        return "Đặt cọc";
      case "UNFREEZE":
        return "Hoàn cọc";
      case "PAYMENT":
        return "Thanh toán";
      case "WITHDRAW":
        return "Rút tiền";
      default:
        return type;
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-card p-6 shadow-md">
      {/* Header + Filter */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="text-lg font-bold text-foreground">Lịch sử giao dịch</h3>
        <div className="flex flex-wrap gap-2">
          {(["ALL", "DEPOSIT", "FREEZE", "UNFREEZE", "PAYMENT"] as FilterType[]).map((type) => (
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
              {type === "ALL"
                ? "Tất cả"
                : type === "DEPOSIT"
                  ? "Nạp tiền"
                  : type === "FREEZE"
                    ? "Đóng cọc"
                    : type === "UNFREEZE"
                      ? "Hoàn cọc"
                      : "Thanh toán"}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="border-b border-white/10 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4">Loại</th>
              <th className="py-3 px-4">Mô tả</th>
              <th className="py-3 px-4 text-right">Số tiền</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="border-b border-white/5 animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-4 w-32 rounded bg-white/5" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-20 rounded bg-white/5" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-40 rounded bg-white/5" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="ml-auto h-4 w-24 rounded bg-white/5" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="mx-auto h-4 w-16 rounded bg-white/5" />
                  </td>
                </tr>
              ))
            ) : filteredTransactions.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  Chưa có giao dịch nào được ghi nhận.
                </td>
              </tr>
            ) : (
              // Data Rows
              filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-white/5 hover:bg-white/2 transition-colors"
                  >
                    <td className="py-4 px-4 text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        <span className="font-medium text-xs">
                          {getTransactionTypeLabel(tx.type)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-xs">{tx.description}</td>
                    <td
                      className={`py-4 px-4 text-right font-bold text-sm ${
                        isPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatCurrencyVND(tx.amount)}
                    </td>
                    <td className="py-4 px-4 text-center">
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

      {/* Pagination Controls */}
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
