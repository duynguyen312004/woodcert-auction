export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "FULFILLING"
  | "COMPLETED"
  | "CANCELED"
  | "DISPUTED";

export type OrderSourceType = "AUCTION";

export type FulfillmentStatus =
  | "PENDING_SHIPMENT"
  | "SHIPPED"
  | "DELIVERED"
  | "AUTO_COMPLETED"
  | "CANCELED";

export interface OrderFulfillmentSummary {
  id: number;
  status: FulfillmentStatus;
  trackingCode: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  autoCompleteDeadline: string | null;
}

export interface OrderSummary {
  id: number;
  sourceType: OrderSourceType;
  sourceId: number;
  status: OrderStatus;
  finalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  platformCommissionRate: number | null;
  platformCommissionAmount: number | null;
  sellerPayoutAmount: number | null;
  forfeitedDepositPlatformFeeAmount: number | null;
  forfeitedDepositSellerAmount: number | null;
  paymentDeadline: string | null;
  paidAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  fulfillment: OrderFulfillmentSummary | null;
  createdAt: string;
}

export type OrderDetail = OrderSummary & {
  productId: number;
  buyerId: string;
  sellerId: string;
  updatedAt: string;
};

export type OrderListParams = {
  page?: number;
  size?: number;
  status?: OrderStatus;
};

export type OrderStatusCounts = {
  total: number;
  byStatus: Record<OrderStatus, number>;
};
