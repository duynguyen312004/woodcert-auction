import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Sparkles, User } from "lucide-react";

import { useCountdown } from "@/shared/hooks/useCountdown";
import { getServerNow } from "@/shared/lib/serverClock";
import { cn } from "@/shared/lib/utils";
import type { OutbidAlert } from "../types";

interface LivePriceStageProps {
  currentPrice: number;
  endTime: string;
  highestBidderMaskedAlias: string | null;
  extensionSeconds: number | null;
  outbidAlert: OutbidAlert | null;
  className?: string;
}

export function LivePriceStage({
  currentPrice,
  endTime,
  highestBidderMaskedAlias,
  extensionSeconds,
  outbidAlert,
  className,
}: LivePriceStageProps) {
  const countdownText = useCountdown(endTime);
  const [prevPrice, setPrevPrice] = useState(currentPrice);
  const [isPriceTicking, setIsPriceTicking] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  if (currentPrice !== prevPrice) {
    setPrevPrice(currentPrice);
    setIsPriceTicking(true);
  }

  useEffect(() => {
    if (!isPriceTicking) return;
    const timer = window.setTimeout(() => setIsPriceTicking(false), 600);
    return () => window.clearTimeout(timer);
  }, [isPriceTicking]);

  useEffect(() => {
    if (!endTime) return;

    const checkUrgency = () => {
      const remaining = new Date(endTime).getTime() - getServerNow();
      setIsUrgent(remaining > 0 && remaining < 300_000);
    };

    checkUrgency();
    const interval = window.setInterval(checkUrgency, 1000);
    return () => window.clearInterval(interval);
  }, [endTime]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col items-center justify-center border-b p-5 text-center transition-colors duration-500 sm:p-8",
        outbidAlert ? "bg-destructive/10" : "bg-muted/20",
        className,
      )}
    >
      {extensionSeconds && !outbidAlert && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-4 flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-bounce"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tự động gia hạn thêm {extensionSeconds} giây
        </div>
      )}

      {outbidAlert && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-4 flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-1 text-xs font-semibold text-destructive shadow-lg animate-outbid-flash"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Bạn đã bị vượt giá - giá mới: {formatCurrency(outbidAlert.price)}
        </div>
      )}

      <div className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Giá hiện tại
      </div>
      <div
        className={`font-serif text-[clamp(2rem,9vw,3rem)] md:text-5xl font-black tracking-tight tabular-nums transition-all duration-300 ${
          outbidAlert
            ? "text-destructive animate-outbid-flash"
            : "text-amber-600 dark:text-amber-400"
        } ${isPriceTicking ? "animate-price-tick" : ""}`}
      >
        {formatCurrency(currentPrice)}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2 rounded-full bg-background border px-4 py-1.5 text-xs text-foreground shadow-sm">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Dẫn đầu:</span>
          <span className="font-semibold font-mono">
            {highestBidderMaskedAlias || "Chưa có lượt đặt"}
          </span>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full bg-background border px-4 py-1.5 text-xs font-semibold shadow-sm transition-all duration-300 ${
            isUrgent
              ? "border-destructive/30 bg-destructive/5 text-destructive animate-countdown-pulse"
              : "text-foreground"
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Thời gian còn lại:</span>
          <span className="font-mono">{countdownText}</span>
        </div>
      </div>
    </div>
  );
}
