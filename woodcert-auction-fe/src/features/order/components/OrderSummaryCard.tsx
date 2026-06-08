import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

import { getOrderStatusText } from "../lib/order-labels";
import type { OrderSummary } from "../types";
import { OrderFeeBreakdown, type OrderBreakdownAudience } from "./OrderFeeBreakdown";

export function OrderSummaryCard({
  order,
  title = "Đơn sau đấu giá",
  emptyMessage = "Chưa có đơn hàng.",
  audience = "buyer",
  actions,
  className,
}: {
  order: OrderSummary | null | undefined;
  title?: string;
  emptyMessage?: string;
  audience?: OrderBreakdownAudience;
  actions?: ReactNode;
  className?: string;
}) {
  const description = order ? getOrderStatusText(order.status) : undefined;

  return (
    <section
      className={cn(
        "rounded-xl border border-stone-200 bg-[#f2eee5] p-6 text-stone-950 shadow-sm",
        className,
      )}
    >
      <div className="mb-4">
        <h2 className="text-lg font-bold font-sans">{title}</h2>
        {description && <p className="mt-1 text-sm text-stone-600 font-sans">{description}</p>}
      </div>
      {!order ? (
        <p className="text-sm text-stone-600 font-sans">{emptyMessage}</p>
      ) : (
        <>
          <OrderFeeBreakdown order={order} audience={audience} lineClassName="border-stone-300" />
          {actions && <div className="mt-4">{actions}</div>}
        </>
      )}
    </section>
  );
}
