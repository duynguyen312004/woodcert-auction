import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { useDisputeHistory } from "@/features/dispute";

import { useOrderDetail, useOrderMutations } from "../hooks/useOrders";
import type { OrderDetail } from "../types";
import { SellerOrderDetailPage } from "./SellerOrderDetailPage";

vi.mock("@/features/dispute", () => ({
  useDisputeHistory: vi.fn(),
}));

vi.mock("@/shared/ui/notification", () => ({
  useNotification: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("../hooks/useOrders", () => ({
  useOrderDetail: vi.fn(),
  useOrderMutations: vi.fn(),
}));

const order = {
  id: 91,
  sourceType: "AUCTION",
  sourceId: 501,
  productId: 801,
  buyerId: "buyer-1",
  sellerId: "seller-1",
  buyer: {
    id: "buyer-1",
    fullName: "Nguyen Van A",
    phoneNumber: "0911222333",
    email: "buyer@example.com",
  },
  status: "PAID",
  finalPrice: 18_400_000,
  depositAmount: 1_500_000,
  remainingAmount: 16_900_000,
  platformCommissionRate: null,
  platformCommissionAmount: null,
  sellerPayoutAmount: null,
  forfeitedDepositPlatformFeeAmount: null,
  forfeitedDepositSellerAmount: null,
  paymentDeadline: "2026-06-11T10:13:00Z",
  paidAt: "2026-06-08T10:13:00Z",
  completedAt: null,
  canceledAt: null,
  cancelReason: null,
  product: {
    id: 801,
    title: "Tượng Thích Ca Mâu Ni",
    imageUrl: null,
  },
  shippingAddress: {
    receiverName: "Tran Thi B",
    phoneNumber: "0987654321",
    streetAddress: "165 Xã Đàn",
    wardCode: "00001",
    wardName: "Phường Nam Đồng",
    districtCode: "001",
    districtName: "Quận Đống Đa",
    provinceCode: "01",
    provinceName: "Thành phố Hà Nội",
  },
  fulfillment: {
    id: 17,
    status: "PENDING_SHIPMENT",
    deliveryMethod: null,
    carrierName: null,
    trackingCode: null,
    shippedAt: null,
    receivedAt: null,
    autoCompleteDeadline: null,
  },
  createdAt: "2026-06-08T10:13:00Z",
  updatedAt: "2026-06-08T10:13:00Z",
} satisfies OrderDetail;

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/seller/orders/91"]}>
      <Routes>
        <Route path="/seller/orders/:orderId" element={<SellerOrderDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SellerOrderDetailPage", () => {
  it("renders buyer account, receiver details, and validates shipping form", async () => {
    vi.mocked(useOrderDetail).mockReturnValue({
      data: order,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useOrderDetail>);
    vi.mocked(useDisputeHistory).mockReturnValue({
      data: [],
      isPending: false,
    } as unknown as ReturnType<typeof useDisputeHistory>);
    vi.mocked(useOrderMutations).mockReturnValue({
      confirmShipping: { mutateAsync: vi.fn(), isPending: false },
    } as unknown as ReturnType<typeof useOrderMutations>);

    renderPage();

    expect(screen.getByText("Nguyen Van A")).toBeVisible();
    expect(screen.getByText("buyer@example.com")).toBeVisible();
    expect(screen.getByText("0911222333")).toBeVisible();
    expect(screen.getByText("Tran Thi B")).toBeVisible();
    expect(screen.getByText(/165 Xã Đàn/)).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: /xác nhận giao hàng/i }));

    expect(screen.getByText(/cần nhập đơn vị vận chuyển và mã vận đơn/i)).toBeVisible();
  });
});
