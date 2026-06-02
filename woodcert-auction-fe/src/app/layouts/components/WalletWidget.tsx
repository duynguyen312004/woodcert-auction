import { Wallet } from "lucide-react";
import { Link } from "react-router";

import { formatCompactVND, formatCurrencyVND } from "@/shared/lib/format";

interface WalletWidgetProps {
  availableBalance: number;
  frozenBalance: number;
}

export function WalletWidget({ availableBalance, frozenBalance }: WalletWidgetProps) {
  const totalBalance = availableBalance + frozenBalance;

  return (
    <div className="group relative">
      <Link
        to="/wallet"
        aria-label="Thông tin ví ký quỹ"
        className="flex h-9 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] pl-1 pr-3.5 shadow-md transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent group-hover:scale-105">
          <Wallet className="h-3.5 w-3.5" />
        </div>
        <span className="font-sans text-xs font-bold tracking-wide text-foreground/90 group-hover:text-primary transition-colors">
          {formatCompactVND(availableBalance)}
        </span>
      </Link>

      <div
        id="wallet-bidding-power"
        className="absolute right-0 top-full z-50 mt-2.5 w-80 invisible rounded-xl border border-white/10 bg-[#161412]/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] opacity-0 transition-all duration-300 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 backdrop-blur-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/75">
            Tài khoản ví ký quỹ
          </span>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Đã bảo chứng
          </div>
        </div>

        {/* Breakdown details */}
        <div className="space-y-3">
          {/* Available balance card */}
          <div className="rounded-lg bg-emerald-500/[0.02] border border-emerald-500/10 p-3 space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-400/80">
              Khả dụng (Để đấu giá)
            </span>
            <div className="font-mono text-base font-bold text-emerald-400">
              {formatCurrencyVND(availableBalance)}
            </div>
          </div>

          {/* Frozen balance card */}
          <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 space-y-1">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">
              Đang ký quỹ tạm khóa
            </span>
            <div className="font-mono text-sm font-semibold text-foreground/80">
              {formatCurrencyVND(frozenBalance)}
            </div>
          </div>

          {/* Total balance row */}
          <div className="flex items-center justify-between pt-3.5 border-t border-white/5 px-1">
            <span className="text-xs font-semibold text-muted-foreground">Tổng tài sản:</span>
            <span className="font-mono text-base font-bold text-primary">
              {formatCurrencyVND(totalBalance)}
            </span>
          </div>

          {/* Action button */}
          <Link
            to="/wallet"
            className="mt-3 flex items-center justify-center gap-1.5 rounded bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
          >
            Quản lý ví & Nạp tiền
          </Link>
        </div>
      </div>
    </div>
  );
}
