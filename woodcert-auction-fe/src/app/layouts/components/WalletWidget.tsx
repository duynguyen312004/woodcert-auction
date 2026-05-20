import { Info, Wallet } from "lucide-react";

import { formatCompactVND, formatCurrencyVND, formatPercent } from "@/shared/lib/format";

interface WalletWidgetProps {
  balance: number;
  depositRate: number;
}

export function WalletWidget({ balance, depositRate }: WalletWidgetProps) {
  const hasValidDepositRate = depositRate > 0;
  const biddingPower = hasValidDepositRate ? balance / depositRate : 0;

  return (
    <div className="group relative cursor-pointer">
      <button
        type="button"
        aria-label="Thông tin ví ký quỹ"
        className="flex items-center gap-2 rounded-full border border-white/15 bg-card/60 px-3 py-1.5 transition-all hover:border-primary/40 hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Wallet className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold tracking-wider text-foreground">
          {formatCompactVND(balance)}
        </span>
      </button>

      <div
        id="wallet-bidding-power"
        className="absolute right-0 top-full z-50 mt-2 w-64 invisible rounded-lg border border-white/10 bg-card p-4 shadow-xl opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100"
      >
        <div className="mb-2 flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            {hasValidDepositRate ? (
              <>
                Tỷ lệ cọc <strong className="text-primary">{formatPercent(depositRate)}</strong>,
                hạn mức đấu giá tối đa:
              </>
            ) : (
              "Tỷ lệ cọc chưa hợp lệ. Hạn mức đặt về 0."
            )}
          </p>
        </div>
        <div className="rounded-md bg-background px-4 py-2 text-center text-xl font-bold text-primary">
          {formatCurrencyVND(biddingPower)}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Số dư ký quỹ</p>
        <p className="text-center text-sm font-semibold text-foreground">
          {formatCurrencyVND(balance)}
        </p>
      </div>
    </div>
  );
}
