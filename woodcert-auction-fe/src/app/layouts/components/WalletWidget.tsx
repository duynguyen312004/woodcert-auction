import { Info, Wallet } from "lucide-react";
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
        className="flex items-center gap-2 rounded-full border border-white/15 bg-card/60 px-3 py-1.5 transition-all hover:border-primary/40 hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Wallet className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold tracking-wider text-foreground">
          {formatCompactVND(availableBalance)}
        </span>
      </Link>

      <div
        id="wallet-bidding-power"
        className="absolute right-0 top-full z-50 mt-2 w-72 invisible rounded-lg border border-white/10 bg-card p-4 shadow-xl opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100"
      >
        <div className="mb-2 flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Thông tin chi tiết số dư ví của bạn:
          </p>
        </div>
        <div className="space-y-2 rounded-md bg-background px-4 py-2.5 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Khả dụng:</span>
            <strong className="text-sm font-semibold text-primary">
              {formatCurrencyVND(availableBalance)}
            </strong>
          </div>
          <div className="flex justify-between border-t border-white/5 pt-1.5">
            <span>Đang đóng băng:</span>
            <strong className="text-sm font-semibold text-foreground/80">
              {formatCurrencyVND(frozenBalance)}
            </strong>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-1.5 font-bold">
            <span>Tổng cộng:</span>
            <strong className="text-sm text-foreground">{formatCurrencyVND(totalBalance)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
