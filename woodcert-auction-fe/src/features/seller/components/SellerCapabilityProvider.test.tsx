import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

import { SellerCapabilityBanner } from "./SellerCapabilityBanner";
import { SellerCapabilityProvider } from "./SellerCapabilityProvider";
import { SellerWriteAccessGuard } from "./SellerWriteAccessGuard";

const useProfile = vi.fn();

vi.mock("@/features/account", () => ({
  useProfile: () => useProfile(),
}));

function renderCapability(status: "ACTIVE" | "BANNED", reason: string | null = null) {
  useProfile.mockReturnValue({
    data: {
      capabilityStatuses: [
        {
          capability: "SELLER",
          status,
          reason,
          updatedAt: "2026-06-06T10:00:00Z",
        },
      ],
    },
  });

  return render(
    <MemoryRouter>
      <SellerCapabilityProvider>
        <SellerCapabilityBanner />
        <SellerWriteAccessGuard>
          <div>Nội dung chỉnh sửa</div>
        </SellerWriteAccessGuard>
      </SellerCapabilityProvider>
    </MemoryRouter>,
  );
}

describe("SellerCapabilityProvider", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps seller write content available when capability is active", () => {
    renderCapability("ACTIVE");

    expect(screen.getByText("Nội dung chỉnh sửa")).toBeVisible();
    expect(screen.queryByText("Quyền bán đang bị đình chỉ")).not.toBeInTheDocument();
  });

  it("shows the admin reason and blocks seller write routes when capability is banned", () => {
    renderCapability("BANNED", "Vi phạm quy định sản phẩm");

    expect(screen.getAllByText("Quyền bán đang bị đình chỉ")).toHaveLength(2);
    expect(screen.getAllByText(/Vi phạm quy định sản phẩm/)).toHaveLength(2);
    expect(screen.queryByText("Nội dung chỉnh sửa")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về tổng quan" })).toHaveAttribute(
      "href",
      "/seller/dashboard",
    );
  });
});
