import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import type { OrderSummary } from "../types";
import { useSellerOrderStatusCounts, useSellerOrders } from "../hooks/useOrders";
import { SellerOrdersPage } from "./SellerOrdersPage";

vi.mock("../hooks/useOrders", () => ({
  useSellerOrders: vi.fn(),
  useSellerOrderStatusCounts: vi.fn(),
}));

const order = {
  id: 91,
  sourceType: "AUCTION",
  sourceId: 501,
  status: "PAID",
  finalPrice: 18_400_000,
  depositAmount: 1_500_000,
  remainingAmount: 16_900_000,
  platformCommissionRate: null,
  platformCommissionAmount: null,
  sellerPayoutAmount: null,
  forfeitedDepositPlatformFeeAmount: null,
  forfeitedDepositSellerAmount: null,
  buyerRefundAmount: null,
  paymentDeadline: "2026-06-11T10:13:00Z",
  paidAt: "2026-06-08T10:13:00Z",
  completedAt: null,
  canceledAt: null,
  refundedAt: null,
  cancelReason: null,
  product: {
    id: 801,
    title: "Tượng Thích Ca Mâu Ni",
    imageUrl: null,
  },
  shippingAddress: null,
  fulfillment: {
    id: 17,
    status: "PENDING_SHIPMENT",
    shipmentDeadline: "2026-06-11T10:13:00Z",
    deliveryMethod: null,
    carrierName: null,
    trackingCode: null,
    shippedAt: null,
    receivedAt: null,
    autoCompleteDeadline: null,
  },
  createdAt: "2026-06-08T10:13:00Z",
} satisfies OrderSummary;

describe("SellerOrdersPage", () => {
  it("renders compact order rows without inline shipping form or raw fulfillment enum", () => {
    vi.mocked(useSellerOrders).mockReturnValue({
      data: {
        result: [order],
        meta: { page: 1, pageSize: 10, pages: 1, total: 1 },
      },
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSellerOrders>);
    vi.mocked(useSellerOrderStatusCounts).mockReturnValue({
      data: {
        total: 1,
        byStatus: {
          PENDING_PAYMENT: 0,
          PAID: 1,
          FULFILLING: 0,
          COMPLETED: 0,
          CANCELED: 0,
          DISPUTED: 0,
        },
      },
    } as unknown as ReturnType<typeof useSellerOrderStatusCounts>);

    render(
      <MemoryRouter>
        <SellerOrdersPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Tượng Thích Ca Mâu Ni")).toBeVisible();
    expect(screen.getByText("Chờ Seller gửi hàng")).toBeVisible();
    expect(screen.getByRole("link", { name: /chi tiết/i })).toBeVisible();
    expect(screen.queryByPlaceholderText(/mã vận/i)).not.toBeInTheDocument();
    expect(screen.queryByText("PENDING_SHIPMENT")).not.toBeInTheDocument();
  });
});
