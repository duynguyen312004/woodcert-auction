import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";

import { SellerProductsPage } from "./SellerProductsPage";

const useSellerProducts = vi.fn();
const useSellerProductStats = vi.fn();
const useSubmitAppraisal = vi.fn();
const useDeleteProduct = vi.fn();

vi.mock("../hooks/useSellerDashboard", () => ({
  useSellerProducts: (...args: unknown[]) => useSellerProducts(...args),
  useSellerProductStats: () => useSellerProductStats(),
}));

vi.mock("../hooks/useProductMutations", () => ({
  useSubmitAppraisal: () => useSubmitAppraisal(),
  useDeleteProduct: () => useDeleteProduct(),
}));

vi.mock("../components/AppraisalSubmissionDialog", () => ({
  AppraisalSubmissionDialog: () => null,
}));

vi.mock("@/shared/ui/notification", () => {
  return {
    NotificationCard: () => null,
    useNotification: () => ({ success: vi.fn(), error: vi.fn() }),
  };
});

function CurrentLocation() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

function renderPage() {
  useSellerProducts.mockReturnValue({
    data: {
      meta: { page: 1, pageSize: 10, pages: 1, total: 1 },
      result: [
        {
          id: "101",
          title: "Tượng gỗ hương",
          woodType: "Gỗ hương",
          status: "APPRAISED",
          saleStatus: "AVAILABLE",
          imageUrl: null,
          createdAt: "2026-06-01T08:00:00Z",
        },
      ],
    },
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  });
  useSubmitAppraisal.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useDeleteProduct.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  useSellerProductStats.mockReturnValue({
    data: {
      total: 1,
      byStatus: {
        DRAFT: 0,
        PENDING_APPRAISAL: 0,
        UNDER_APPRAISAL: 0,
        REJECTED: 0,
        APPRAISED: 1,
      },
      bySaleStatus: {
        AVAILABLE: 1,
        IN_AUCTION: 0,
        PENDING_ORDER: 0,
        SOLD: 0,
        RETURNED: 0,
      },
    },
  });

  return render(
    <MemoryRouter initialEntries={["/seller/products"]}>
      <Routes>
        <Route
          path="/seller/products"
          element={
            <>
              <SellerProductsPage />
              <CurrentLocation />
            </>
          }
        />
        <Route
          path="/seller/products/:productId"
          element={
            <>
              <div>Chi tiết sản phẩm</div>
              <CurrentLocation />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SellerProductsPage detail navigation", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("provides an explicit product detail action", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "Xem chi tiết" })).toHaveAttribute(
      "href",
      "/seller/products/101",
    );
  });

  it("opens product detail when the row is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByRole("link", { name: "Xem chi tiết Tượng gỗ hương" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/seller/products/101");
  });
});
