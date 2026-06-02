import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, PlusCircle } from "lucide-react";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { useWalletTransactions } from "../hooks/useWalletTransactions";
import { useDeposits } from "../hooks/useDeposits";
import { WALLET_BALANCE_QUERY_KEY } from "../hooks/useWalletBalance";
import { WALLET_TRANSACTIONS_QUERY_KEY } from "../hooks/useWalletTransactions";
import { WALLET_DEPOSITS_QUERY_KEY } from "../hooks/useDeposits";
import { BalanceCard } from "../components/BalanceCard";
import { TransactionTable } from "../components/TransactionTable";
import { DepositTable } from "../components/DepositTable";

export function WalletPage() {
  const [transactionPage, setTransactionPage] = useState(1);
  const [depositPage, setDepositPage] = useState(1);
  const size = 10;
  const queryClient = useQueryClient();

  // Lắng nghe BroadcastChannel từ tab nạp tiền → tự cập nhật số dư khi nạp thành công
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("wallet");
      bc.onmessage = (event) => {
        if (event.data?.type === "WALLET_UPDATED") {
          queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: WALLET_TRANSACTIONS_QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: WALLET_DEPOSITS_QUERY_KEY });
        }
      };
    } catch {
      // BroadcastChannel không hỗ trợ → bỏ qua
    }
    return () => {
      bc?.close();
    };
  }, [queryClient]);

  // Load số dư ví
  const { data: wallet } = useWalletBalance();

  // Load lịch sử giao dịch
  const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions(
    transactionPage,
    size,
  );
  const { data: depositsData, isLoading: depositsLoading } = useDeposits(depositPage, size);

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-[1280px] px-6 space-y-8">
        {/* Page Title & CTA */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
              Ví Của Tôi
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Quản lý số dư khả dụng, hạn mức đặt cọc đấu giá và theo dõi lịch sử giao dịch.
            </p>
          </div>
          <div>
            <a
              href="/wallet/deposit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98]"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nạp tiền vào ví</span>
            </a>
          </div>
        </div>

        {/* Balance Section */}
        <BalanceCard
          availableBalance={wallet?.availableBalance ?? 0}
          frozenBalance={wallet?.frozenBalance ?? 0}
        />

        {/* Lịch sử giao dịch */}
        <TransactionTable
          transactions={transactionsData?.result ?? []}
          isLoading={transactionsLoading}
          page={transactionPage}
          totalPages={transactionsData?.meta.pages ?? 1}
          onPageChange={setTransactionPage}
        />

        <DepositTable
          deposits={depositsData?.result ?? []}
          isLoading={depositsLoading}
          page={depositPage}
          totalPages={depositsData?.meta.pages ?? 1}
          onPageChange={setDepositPage}
        />

        {/* Hướng dẫn cơ chế ký quỹ đấu giá */}
        <div className="rounded-xl border border-white/10 bg-card/40 p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Cơ chế đặt cọc đấu giá (Ký quỹ)
            </h3>
          </div>
          <div className="grid gap-6 text-xs text-muted-foreground md:grid-cols-3">
            <div className="space-y-2 rounded-lg bg-background/50 p-4 border border-white/5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-3xs text-primary">
                  1
                </span>
                Nạp tiền vào ví
              </div>
              <p>
                Bạn nạp tiền thông qua cổng thanh toán VNPay. Số tiền nạp sẽ được cộng trực tiếp vào{" "}
                <strong>Số dư khả dụng</strong> của bạn.
              </p>
            </div>
            <div className="space-y-2 rounded-lg bg-background/50 p-4 border border-white/5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-3xs text-primary">
                  2
                </span>
                Đăng ký tham gia phiên
              </div>
              <p>
                Khi bạn đăng ký một phiên đấu giá, hệ thống sẽ tạm thời <strong>đóng băng</strong>{" "}
                số tiền đặt cọc quy định. Hạn mức đặt cọc này đảm bảo quyền tham gia của bạn.
              </p>
            </div>
            <div className="space-y-2 rounded-lg bg-background/50 p-4 border border-white/5">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-3xs text-primary">
                  3
                </span>
                Kết thúc phiên đấu giá
              </div>
              <p>
                Nếu thua cuộc, số tiền đặt cọc được <strong>hoàn trả</strong> lại số khả dụng. Nếu
                thắng cuộc, cọc sẽ được chuyển thành thanh toán một phần đơn hàng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
