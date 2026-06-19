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

export type DeliveryMethod = "THIRD_PARTY" | "SELF_DELIVERY";

export interface OrderFulfillmentSummary {
  id: number;
  status: FulfillmentStatus;
  shipmentDeadline: string | null;
  deliveryMethod: DeliveryMethod | null;
  carrierName: string | null;
  trackingCode: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  autoCompleteDeadline: string | null;
}

export interface OrderProductSummary {
  id: number;
  title: string | null;
  imageUrl: string | null;
}

export interface OrderShippingAddress {
  receiverName: string;
  phoneNumber: string;
  streetAddress: string;
  wardCode: string | null;
  wardName: string | null;
  districtCode: string | null;
  districtName: string | null;
  provinceCode: string | null;
  provinceName: string | null;
}

export interface OrderBuyerSummary {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  email: string;
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
  buyerRefundAmount: number | null;
  paymentDeadline: string | null;
  paidAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  refundedAt: string | null;
  cancelReason: string | null;
  product?: OrderProductSummary | null;
  shippingAddress?: OrderShippingAddress | null;
  fulfillment: OrderFulfillmentSummary | null;
  createdAt: string;
}

export type OrderDetail = OrderSummary & {
  productId: number;
  buyerId: string;
  sellerId: string;
  buyer: OrderBuyerSummary | null;
  updatedAt: string;
};

export type ConfirmShippingPayload = {
  deliveryMethod: DeliveryMethod;
  carrierName?: string;
  trackingCode?: string;
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

export type SellerSalesRange = "7D" | "30D" | "90D" | "ALL";

export interface SellerDailySales {
  date: string;
  grossSales: number;
  platformCommission: number;
  sellerPayout: number;
  forfeitedDepositIncome: number;
  totalRealizedIncome: number;
}

export interface SellerSalesSummary {
  range: SellerSalesRange;
  grossSales: number;
  platformCommission: number;
  sellerPayout: number;
  forfeitedDepositIncome: number;
  totalRealizedIncome: number;
  completedOrders: number;
  daily: SellerDailySales[];
}
