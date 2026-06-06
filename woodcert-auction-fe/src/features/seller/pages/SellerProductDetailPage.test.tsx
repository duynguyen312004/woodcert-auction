import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import type { ProductDetail, ProductStatus } from "../types";
import { SellerProductDetailPage } from "./SellerProductDetailPage";

const useSellerProductDetail = vi.fn();

vi.mock("../hooks/useSellerDashboard", () => ({
  useSellerProductDetail: (...args: unknown[]) => useSellerProductDetail(...args),
}));

function productFixture(
  status: ProductStatus,
  overrides: Partial<ProductDetail> = {},
): ProductDetail {
  return {
    id: 101,
    title: "Tượng gỗ hương",
    description: "Tác phẩm chạm khắc thủ công.",
    material: "Gỗ hương",
    dimensions: "40 x 20 x 60 cm",
    weight: 12,
    status,
    saleStatus: "AVAILABLE",
    category: { id: 1, name: "Tượng gỗ" },
    images: [
      {
        id: 11,
        mediaId: 501,
        imageUrl: "https://cdn.example/product.jpg",
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    appraisalReport: null,
    submittedAt: status === "DRAFT" ? null : "2026-06-01T08:00:00Z",
    appraisalClaimedBy: null,
    appraisalClaimedAt: null,
    appraisalClaimExpiresAt: null,
    rejectedReason: null,
    createdAt: "2026-05-30T08:00:00Z",
    ...overrides,
  };
}

function renderPage(product: ProductDetail) {
  useSellerProductDetail.mockReturnValue({
    data: product,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={["/seller/products/101"]}>
      <Routes>
        <Route path="/seller/products/:productId" element={<SellerProductDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SellerProductDetailPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each([
    ["DRAFT", "Sản phẩm đang ở bản nháp"],
    ["PENDING_APPRAISAL", "Đang chờ kiểm định viên tiếp nhận"],
    ["UNDER_APPRAISAL", "Kiểm định viên đang đánh giá sản phẩm"],
    ["APPRAISED", "Sản phẩm đã được xác thực"],
    ["REJECTED", "Sản phẩm không đạt kiểm định"],
  ] as const)("shows the appraisal progress for %s", (status, expectedHeading) => {
    renderPage(productFixture(status));
    expect(screen.getByRole("heading", { name: expectedHeading })).toBeVisible();
  });

  it("shows owner review details, proof images, certificate and auction actions", () => {
    renderPage(
      productFixture("APPRAISED", {
        appraisalReport: {
          certificateCode: "CERT-2026-00101",
          verifiedMaterial: "Gỗ hương đỏ",
          origin: "Gia Lai",
          ageEstimation: "40-50 năm",
          conditionGrade: "GOOD",
          estimatedValue: 125000000,
          isAuthentic: true,
          digitalSignature: "sha256:signed-report",
          appraisedAt: "2026-06-05T10:00:00Z",
          appraiserNotes: "Vân gỗ và kết cấu phù hợp với mẫu đối chứng.",
          sellerAccuracy: null,
          proofImages: [
            {
              id: 7,
              mediaId: 900,
              description: "Ảnh mặt cắt thớ gỗ",
              imageUrl: "https://cdn.example/proof.jpg",
            },
          ],
        },
      }),
    );

    expect(screen.getByRole("heading", { name: "Kết quả xác thực hợp lệ" })).toBeVisible();
    expect(screen.getByText("Vân gỗ và kết cấu phù hợp với mẫu đối chứng.")).toBeVisible();
    expect(screen.getByAltText("Ảnh mặt cắt thớ gỗ")).toBeVisible();
    expect(screen.queryByText(/sellerAccuracy/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem chứng thư" })).toHaveAttribute(
      "href",
      "/certificates/CERT-2026-00101",
    );
    expect(screen.getByRole("link", { name: "Tạo phiên đấu giá" })).toHaveAttribute(
      "href",
      "/seller/auctions/new?productId=101",
    );
  });

  it("emphasizes rejection reason and appraiser notes without edit action", () => {
    renderPage(
      productFixture("REJECTED", {
        rejectedReason: "Vật liệu thực tế không trùng với hồ sơ.",
        appraisalReport: {
          certificateCode: "CERT-2026-00102",
          verifiedMaterial: "Gỗ thông",
          origin: null,
          ageEstimation: null,
          conditionGrade: "FAIR",
          estimatedValue: 5000000,
          isAuthentic: false,
          digitalSignature: "sha256:rejected-report",
          appraisedAt: "2026-06-05T10:00:00Z",
          appraiserNotes: "Mẫu vân cho thấy sản phẩm không phải gỗ hương.",
          sellerAccuracy: null,
          proofImages: [],
        },
      }),
    );

    expect(screen.getByRole("heading", { name: "Kết quả không đạt kiểm định" })).toBeVisible();
    expect(screen.getByText("Vật liệu thực tế không trùng với hồ sơ.")).toBeVisible();
    expect(screen.getByText("Mẫu vân cho thấy sản phẩm không phải gỗ hương.")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Chỉnh sửa" })).not.toBeInTheDocument();
  });
});
