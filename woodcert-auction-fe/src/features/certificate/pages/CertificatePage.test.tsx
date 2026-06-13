import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import type { CertificateVerification } from "../api/certificateApi";
import { CertificatePage } from "./CertificatePage";

const verifyCertificate = vi.fn();

vi.mock("../api/certificateApi", () => ({
  certificateApi: {
    verify: (...args: unknown[]) => verifyCertificate(...args),
  },
}));

const certificate: CertificateVerification = {
  certificateCode: "CERT-2026-00001",
  productId: 101,
  productTitle: "Tượng Thích Ca Mâu Ni",
  description: "Tác phẩm chạm khắc thủ công.",
  imageUrls: [],
  category: {
    id: 1,
    name: "Tượng & Điêu Khắc Gỗ",
    slug: "tuong-dieu-khac-go",
    parentId: null,
    description: null,
  },
  material: "Gỗ Hương Chương",
  verifiedMaterial: "Gỗ Hương Chương",
  origin: "Miền Bắc Việt Nam",
  ageEstimation: "20",
  conditionGrade: "EXCELLENT",
  estimatedValue: 15_000_000,
  authentic: true,
  integrityHash: "a".repeat(64),
  appraisedAt: "2026-06-13T07:33:00Z",
  dimensions: "40×40×68 cm",
  weight: 24,
  sellerName: "Nghệ Nhân Khánh Duy",
  appraiserName: "WoodCert Appraiser",
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/certificates/CERT-2026-00001"]}>
        <Routes>
          <Route path="/certificates/:certificateCode" element={<CertificatePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CertificatePage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("displays the user-provided dimensions without appending another unit", async () => {
    verifyCertificate.mockResolvedValue(certificate);

    renderPage();

    expect(await screen.findByText("40×40×68 cm")).toBeVisible();
    expect(screen.queryByText("40×40×68 cm cm")).not.toBeInTheDocument();
    expect(verifyCertificate).toHaveBeenCalledWith("CERT-2026-00001");
  });
});
