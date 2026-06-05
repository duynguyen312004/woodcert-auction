import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import type { SellerAuctionDetail } from "../types";
import { SellerAuctionDetailPage } from "./SellerAuctionDetailPage";

vi.mock("@/shared/ui/notification", () => ({
  useNotification: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/shared/hooks/useCountdown", () => ({
  useCountdown: () => "00 : 10 : 00",
}));

vi.mock("../hooks/useProductMutations", () => ({
  useCancelAuction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useConfirmShipping: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/useSellerDashboard", () => ({
  useSellerAuctionDetail: vi.fn(),
}));

import { useSellerAuctionDetail } from "../hooks/useSellerDashboard";

function makeAuction(overrides: Partial<SellerAuctionDetail> = {}): SellerAuctionDetail {
  return {
    id: "501",
    status: "ACTIVE",
    startingPrice: 10000000,
    reservePrice: 12000000,
    stepPrice: 100000,
    depositAmount: 1000000,
    currentPrice: 13000000,
    finalPrice: null,
    startTime: "2026-05-25T11:00:00Z",
    endTime: "2026-05-25T13:00:00Z",
    participantCount: 3,
    winnerMaskedAlias: null,
    settlementStatus: "NOT_APPLICABLE",
    settlement: { frozen: 3, refunded: 0, deducted: 0, confiscated: 0 },
    product: {
      id: 101,
      title: "Tượng gỗ trắc",
      description: "Đục tay",
      material: "Gỗ trắc",
      dimensions: "30x20x10",
      weight: "2.5",
      primaryImage: null,
      images: [],
      appraisal: {
        certificateCode: "CERT-1",
        verifiedMaterial: "Gỗ trắc",
        origin: "Việt Nam",
        ageEstimation: "30 năm",
        conditionGrade: "GOOD",
        estimatedValue: "18000000",
        isAuthentic: true,
      },
    },
    createdAt: "2026-05-24T10:00:00Z",
    updatedAt: "2026-05-25T12:00:00Z",
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/seller/auctions/501"]}>
      <Routes>
        <Route path="/seller/auctions/:auctionId" element={<SellerAuctionDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SellerAuctionDetailPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders terminal result and settlement summary", () => {
    vi.mocked(useSellerAuctionDetail).mockReturnValue({
      data: makeAuction({
        status: "ENDED_SUCCESS",
        finalPrice: 15000000,
        winnerMaskedAlias: "winn****",
        settlementStatus: "SETTLED",
        settlement: { frozen: 0, refunded: 2, deducted: 1, confiscated: 0 },
      }),
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSellerAuctionDetail>);

    renderPage();

    expect(screen.getAllByRole("heading", { name: "Tượng gỗ trắc" })[0]).toBeVisible();
    expect(screen.getAllByText("Đã chốt bán")[0]).toBeVisible();
    expect(screen.getByText("winn****")).toBeVisible();
    expect(screen.getAllByText("Đã đối soát cọc")[0]).toBeVisible();
  });

  it("shows cancel action only while waiting", () => {
    vi.mocked(useSellerAuctionDetail).mockReturnValue({
      data: makeAuction({ status: "WAITING" }),
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSellerAuctionDetail>);

    renderPage();

    expect(screen.getByRole("button", { name: /hủy phiên/i })).toBeVisible();
  });
});
