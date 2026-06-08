import type { DeliveryMethod, FulfillmentStatus, OrderStatus } from "../types";

const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Chờ buyer thanh toán phần còn lại",
  PAID: "Buyer đã thanh toán, chờ seller giao hàng",
  FULFILLING: "Đang giao hàng",
  COMPLETED: "Đã hoàn tất",
  CANCELED: "Đã hủy",
  DISPUTED: "Đang có tranh chấp",
};

const FULFILLMENT_STATUS_TEXT: Record<FulfillmentStatus, string> = {
  PENDING_SHIPMENT: "Chờ seller giao hàng",
  SHIPPED: "Đang giao",
  DELIVERED: "Buyer đã nhận hàng",
  AUTO_COMPLETED: "Tự động hoàn tất",
  CANCELED: "Đã hủy vận chuyển",
};

const DELIVERY_METHOD_TEXT: Record<DeliveryMethod, string> = {
  THIRD_PARTY: "Đơn vị vận chuyển",
  SELF_DELIVERY: "Tự giao",
};

const CANCEL_REASON_TEXT: Record<string, string> = {
  PAYMENT_DEADLINE_EXCEEDED: "Buyer quá hạn thanh toán",
  DISPUTE_BUYER_WINS: "Tranh chấp xử lý nghiêng về buyer",
};

export function getOrderStatusText(status: OrderStatus) {
  return ORDER_STATUS_TEXT[status] ?? status;
}

export function getFulfillmentStatusText(status: FulfillmentStatus | null | undefined) {
  return status ? (FULFILLMENT_STATUS_TEXT[status] ?? status) : "Chưa tạo";
}

export function getDeliveryMethodText(method: DeliveryMethod | null | undefined) {
  return method ? (DELIVERY_METHOD_TEXT[method] ?? method) : "Chưa chọn";
}

export function getCancelReasonText(reason: string | null | undefined) {
  return reason ? (CANCEL_REASON_TEXT[reason] ?? reason) : "Không có ghi chú";
}
