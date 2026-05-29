import { Lock, Wallet } from "lucide-react";
import { formatCurrencyVND } from "@/shared/lib/format";

interface BalanceCardProps {
  availableBalance: number;
  frozenBalance: number;
}

export function BalanceCard({ availableBalance, frozenBalance }: BalanceCardProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Khối Số dư khả dụng */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 p-6 shadow-md transition-all hover:scale-[1.01] hover:border-emerald-500/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-emerald-400">Số dư khả dụng</span>
          <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-400">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            {formatCurrencyVND(availableBalance)}
          </span>
          <p className="mt-2 text-xs text-muted-foreground">
            Số dư khả dụng dùng để đăng ký tham gia và đóng cọc các phiên đấu giá.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl" />
      </div>

      {/* Khối Số dư đóng băng */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/10 bg-gradient-to-br from-sky-500/5 to-sky-600/10 p-6 shadow-md transition-all hover:scale-[1.01] hover:border-sky-500/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-sky-400">Đang đóng băng (Ký quỹ)</span>
          <div className="rounded-full bg-sky-500/10 p-2.5 text-sky-400">
            <Lock className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            {formatCurrencyVND(frozenBalance)}
          </span>
          <p className="mt-2 text-xs text-muted-foreground">
            Số tiền đang được giữ tạm thời để làm tiền đặt cọc cho các phiên đấu giá đang diễn ra.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-sky-500/5 blur-2xl" />
      </div>
    </div>
  );
}
