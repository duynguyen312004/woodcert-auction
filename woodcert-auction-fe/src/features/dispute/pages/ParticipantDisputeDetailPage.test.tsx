import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOrderDetail } from "@/features/order/hooks/useOrders";
import type { OrderDetail } from "@/features/order/types";

import {
  useAddParticipantDisputeMessage,
  useCancelDispute,
  useDisputeDetail,
} from "../hooks/useDisputes";
import type { DisputeDetail } from "../types";
import { BuyerDisputeDetailPage, SellerDisputeDetailPage } from "./ParticipantDisputeDetailPage";

vi.mock("@/features/order/hooks/useOrders", () => ({
  useOrderDetail: vi.fn(),
}));

vi.mock("../hooks/useDisputes", () => ({
  useDisputeDetail: vi.fn(),
  useAddParticipantDisputeMessage: vi.fn(),
  useCancelDispute: vi.fn(),
}));

vi.mock("@/shared/ui/notification", () => ({
  useNotification: () => ({
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  }),
}));

const order = {
  id: 91,
  sourceType: "AUCTION",
  sourceId: 501,
  productId: 801,
  buyerId: "buyer-1",
  sellerId: "seller-1",
  buyer: null,
  status: "DISPUTED",
  finalPrice: 18_400_000,
  depositAmount: 1_500_000,
  remainingAmount: 16_900_000,
  platformCommissionRate: null,
  platformCommissionAmount: null,
  sellerPayoutAmount: null,
  forfeitedDepositPlatformFeeAmount: null,
  forfeitedDepositSellerAmount: null,
  buyerRefundAmount: null,
  paymentDeadline: null,
  paidAt: "2026-06-02T00:00:00Z",
  completedAt: null,
  canceledAt: null,
  refundedAt: null,
  cancelReason: null,
  product: {
    id: 801,
    title: "Tượng gỗ trắc",
    imageUrl: "https://cdn.example/product.jpg",
  },
  shippingAddress: null,
  fulfillment: null,
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-02T00:00:00Z",
} satisfies OrderDetail;

function detail(status: DisputeDetail["dispute"]["status"]): DisputeDetail {
  return {
    dispute: {
      id: 31,
      orderId: 91,
      fulfillmentId: 17,
      openedByUserId: "buyer-1",
      status,
      reason: "Sản phẩm bị nứt ở chân đế",
      description: "Vết nứt không có trong mô tả ban đầu.",
      openedAt: "2026-06-02T00:00:00Z",
      resolvedAt: status === "RESOLVED" ? "2026-06-02T02:00:00Z" : null,
      resolvedByAdminId: status === "RESOLVED" ? "admin-1" : null,
      resolutionOutcome: status === "RESOLVED" ? "BUYER_WINS" : null,
      resolutionNote: status === "RESOLVED" ? "Bằng chứng xác nhận hàng không đúng mô tả." : null,
      evidence: [
        {
          id: 1,
          mediaId: 101,
          url: "https://cdn.example/opening.jpg",
          originalFilename: "opening.jpg",
          sortOrder: 0,
        },
      ],
    },
    messages: [
      {
        id: 41,
        authorRole: "SELLER",
        content: "Tôi gửi thêm ảnh trước khi đóng kiện.",
        createdAt: "2026-06-02T00:20:00Z",
        evidence: [],
      },
      {
        id: 42,
        authorRole: "ADMIN",
        content: "Vui lòng bổ sung ảnh kiện hàng.",
        createdAt: "2026-06-02T00:30:00Z",
        evidence: [],
      },
    ],
  };
}

function renderPage(audience: "buyer" | "seller", status: DisputeDetail["dispute"]["status"]) {
  vi.mocked(useOrderDetail).mockReturnValue({
    data: order,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useOrderDetail>);
  vi.mocked(useDisputeDetail).mockReturnValue({
    data: detail(status),
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useDisputeDetail>);

  const Page = audience === "buyer" ? BuyerDisputeDetailPage : SellerDisputeDetailPage;
  const path =
    audience === "buyer"
      ? "/orders/:orderId/disputes/:disputeId"
      : "/seller/orders/:orderId/disputes/:disputeId";
  const initialEntry =
    audience === "buyer" ? "/orders/91/disputes/31" : "/seller/orders/91/disputes/31";

  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={path} element={<Page />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ParticipantDisputeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAddParticipantDisputeMessage).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAddParticipantDisputeMessage>);
    vi.mocked(useCancelDispute).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCancelDispute>);
  });

  it("shows the full Vietnamese timeline and composer to the buyer", () => {
    renderPage("buyer", "UNDER_REVIEW");

    expect(screen.getAllByText("Đang được xem xét").length).toBeGreaterThan(0);
    expect(screen.queryByText("UNDER_REVIEW")).not.toBeInTheDocument();
    expect(screen.getByText("Người bán")).toBeVisible();
    expect(screen.getByText("Quản trị viên")).toBeVisible();
    expect(screen.getByLabelText("Thêm phản hồi")).toBeVisible();
    expect(screen.getByRole("button", { name: "Hủy tranh chấp" })).toBeVisible();
  });

  it("allows the seller to respond but not cancel the case", () => {
    renderPage("seller", "OPEN");

    expect(screen.getByLabelText("Thêm phản hồi")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Hủy tranh chấp" })).not.toBeInTheDocument();
  });

  it("switches a resolved case to read-only and renders the localized outcome", () => {
    renderPage("buyer", "RESOLVED");

    expect(screen.queryByLabelText("Thêm phản hồi")).not.toBeInTheDocument();
    expect(screen.getByText(/chỉ đọc/i)).toBeVisible();
    expect(screen.getAllByText("Người mua thắng - hoàn tiền").length).toBeGreaterThan(0);
    expect(screen.queryByText("BUYER_WINS")).not.toBeInTheDocument();
  });
});
