import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { useCancelDispute, useCurrentDispute, useDisputeHistory } from "@/features/dispute";

import { useOrderDetail, useOrderMutations } from "../hooks/useOrders";
import type { OrderDetail } from "../types";
import { BuyerOrderDetailPage } from "./BuyerOrderDetailPage";

vi.mock("@/features/dispute", () => ({
  useCancelDispute: vi.fn(),
  useCurrentDispute: vi.fn(),
  useDisputeHistory: vi.fn(),
  DisputeHistoryPanel: () => null,
  OpenDisputeDialog: () => null,
}));

vi.mock("@/shared/ui/notification", () => ({
  useNotification: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("../hooks/useOrders", () => ({
  useOrderDetail: vi.fn(),
  useOrderMutations: vi.fn(),
}));

vi.mock("../components/PaymentAddressDialog", () => ({
  PaymentAddressDialog: () => null,
}));

vi.mock("../components/OpenDisputeDialog", () => ({
  OpenDisputeDialog: () => null,
}));

vi.mock("../components/DisputeHistoryPanel", () => ({
  DisputeHistoryPanel: () => null,
}));

const order = {
  id: 91,
  sourceType: "AUCTION",
  sourceId: 501,
  productId: 801,
  buyerId: "buyer-1",
  sellerId: "seller-1",
  buyer: null,
  status: "FULFILLING",
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
    status: "SHIPPED",
    shipmentDeadline: "2026-06-11T10:13:00Z",
    deliveryMethod: "THIRD_PARTY",
    carrierName: "Viettel Post",
    trackingCode: "VT123",
    shippedAt: "2026-06-09T10:13:00Z",
    receivedAt: null,
    autoCompleteDeadline: "2026-06-16T10:13:00Z",
  },
  createdAt: "2026-06-08T10:13:00Z",
  updatedAt: "2026-06-09T10:13:00Z",
} satisfies OrderDetail;

describe("BuyerOrderDetailPage", () => {
  it("warns the buyer about automatic completion and links to the rules", () => {
    vi.mocked(useOrderDetail).mockReturnValue({
      data: order,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useOrderDetail>);
    vi.mocked(useCurrentDispute).mockReturnValue({
      data: null,
    } as unknown as ReturnType<typeof useCurrentDispute>);
    vi.mocked(useDisputeHistory).mockReturnValue({
      data: [],
      isPending: false,
    } as unknown as ReturnType<typeof useDisputeHistory>);
    vi.mocked(useCancelDispute).mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useCancelDispute>);
    vi.mocked(useOrderMutations).mockReturnValue({
      payRemainder: { isPending: false, mutateAsync: vi.fn() },
      confirmReceived: { isPending: false, mutateAsync: vi.fn() },
    } as unknown as ReturnType<typeof useOrderMutations>);

    render(
      <MemoryRouter initialEntries={["/account/orders/91"]}>
        <Routes>
          <Route path="/account/orders/:orderId" element={<BuyerOrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/hãy kiểm tra hàng trước thời điểm tự động hoàn tất/i)).toBeVisible();
    expect(screen.getByText(/nếu chưa nhận được hàng hoặc hàng có vấn đề/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /xem quy định/i })).toHaveAttribute(
      "href",
      "/guide#order-deadlines",
    );
    expect(screen.getByRole("button", { name: /mở tranh chấp/i })).toBeVisible();
  });
});
