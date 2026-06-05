import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

import { AdminDashboardPage } from "./AdminDashboardPage";

const getUsers = vi.fn();
const getAdminDisputes = vi.fn();
const getStats = vi.fn();

vi.mock("../api/users", () => ({
  adminUserApi: { getUsers: (...args: unknown[]) => getUsers(...args) },
}));

vi.mock("../api/revenue", () => ({
  revenueApi: { getStats: () => getStats() },
}));

vi.mock("@/features/dispute", () => ({
  disputeApi: { getAdminDisputes: (...args: unknown[]) => getAdminDisputes(...args) },
}));

vi.mock("@/shared/lib/format", () => ({
  formatVND: (value: number) => `${value} đ`,
}));

function meta(total: number) {
  return { meta: { page: 1, pageSize: 1, pages: 1, total }, result: [] };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AdminDashboardPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders aggregated stats from the supporting endpoints", async () => {
    getUsers.mockResolvedValue(meta(42));
    getAdminDisputes.mockResolvedValue(meta(3));
    getStats.mockResolvedValue({ totalAmount: 1500000, byType: {} });

    renderPage();

    expect(await screen.findByText("42")).toBeVisible();
    expect(await screen.findByText("3")).toBeVisible();
    expect(await screen.findByText("1500000 đ")).toBeVisible();
    expect(screen.getByText("Tổng người dùng")).toBeVisible();
    expect(screen.getByText("Tranh chấp đang mở")).toBeVisible();
  });
});
