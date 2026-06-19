import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

import { getOrderStatusText } from "../lib/order-labels";
import type { OrderSummary } from "../types";

export type OrderBreakdownAudience = "buyer" | "seller";

export function OrderFeeBreakdown({
  order,
  audience = "buyer",
  className,
  lineClassName,
  labelClassName,
  valueClassName,
  showStatus = false,
}: {
  order: OrderSummary;
  audience?: OrderBreakdownAudience;
  className?: string;
  lineClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  showStatus?: boolean;
}) {
  const showSellerSaleBreakdown = audience === "seller" && order.status === "COMPLETED";
  const showSellerForfeitBreakdown =
    audience === "seller" &&
    order.status === "CANCELED" &&
    Boolean(order.forfeitedDepositPlatformFeeAmount || order.forfeitedDepositSellerAmount);
  const showBuyerRefund = Boolean(order.buyerRefundAmount);

  return (
    <div className={cn("grid gap-0", className)}>
      {showStatus && (
        <OrderLine
          label="Trạng thái đơn"
          value={getOrderStatusText(order.status)}
          strong
          lineClassName={lineClassName}
          labelClassName={labelClassName}
          valueClassName={valueClassName}
        />
      )}
      <OrderLine
        label="Giá chốt"
        value={formatVND(order.finalPrice)}
        strong
        lineClassName={lineClassName}
        labelClassName={labelClassName}
        valueClassName={valueClassName}
      />
      <OrderLine
        label="Cọc đã áp dụng"
        value={formatVND(order.depositAmount)}
        lineClassName={lineClassName}
        labelClassName={labelClassName}
        valueClassName={valueClassName}
      />
      <OrderLine
        label="Buyer còn phải trả"
        value={formatVND(order.remainingAmount)}
        strong={audience === "buyer"}
        lineClassName={lineClassName}
        labelClassName={labelClassName}
        valueClassName={valueClassName}
      />
      {showSellerSaleBreakdown && (
        <>
          <OrderLine
            label="Phí sàn"
            value={formatVND(order.platformCommissionAmount ?? 0)}
            strong
            lineClassName={lineClassName}
            labelClassName={labelClassName}
            valueClassName={valueClassName}
          />
          <OrderLine
            label="Seller thực nhận"
            value={formatVND(order.sellerPayoutAmount ?? 0)}
            strong
            lineClassName={lineClassName}
            labelClassName={labelClassName}
            valueClassName={valueClassName}
          />
        </>
      )}
      {showSellerForfeitBreakdown && (
        <>
          <OrderLine
            label="Sàn giữ từ cọc"
            value={formatVND(order.forfeitedDepositPlatformFeeAmount ?? 0)}
            lineClassName={lineClassName}
            labelClassName={labelClassName}
            valueClassName={valueClassName}
          />
          <OrderLine
            label="Seller nhận từ cọc"
            value={formatVND(order.forfeitedDepositSellerAmount ?? 0)}
            strong
            lineClassName={lineClassName}
            labelClassName={labelClassName}
            valueClassName={valueClassName}
          />
        </>
      )}
      {showBuyerRefund && (
        <OrderLine
          label="Đã hoàn cho buyer"
          value={formatVND(order.buyerRefundAmount ?? 0)}
          strong
          lineClassName={lineClassName}
          labelClassName={labelClassName}
          valueClassName={valueClassName}
        />
      )}
      {order.paymentDeadline && (
        <OrderLine
          label="Hạn thanh toán"
          value={formatDateTime(order.paymentDeadline)}
          lineClassName={lineClassName}
          labelClassName={labelClassName}
          valueClassName={valueClassName}
        />
      )}
      {order.fulfillment?.shipmentDeadline && (
        <OrderLine
          label="Hạn giao hàng"
          value={formatDateTime(order.fulfillment.shipmentDeadline)}
          lineClassName={lineClassName}
          labelClassName={labelClassName}
          valueClassName={valueClassName}
        />
      )}
      {order.fulfillment?.autoCompleteDeadline && (
        <OrderLine
          label="Tự hoàn tất"
          value={formatDateTime(order.fulfillment.autoCompleteDeadline)}
          lineClassName={lineClassName}
          labelClassName={labelClassName}
          valueClassName={valueClassName}
        />
      )}
      {order.fulfillment?.trackingCode && (
        <OrderLine
          label="Mã vận đơn"
          value={order.fulfillment.trackingCode}
          lineClassName={lineClassName}
          labelClassName={labelClassName}
          valueClassName={valueClassName}
        />
      )}
    </div>
  );
}

function OrderLine({
  label,
  value,
  strong = false,
  lineClassName,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  strong?: boolean;
  lineClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("flex justify-between gap-4 border-b py-2.5 last:border-0", lineClassName)}>
      <span className={cn("text-sm text-stone-500", labelClassName)}>{label}</span>
      <span
        className={cn(
          "text-right text-sm font-semibold",
          strong && "font-bold tabular-nums",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}
