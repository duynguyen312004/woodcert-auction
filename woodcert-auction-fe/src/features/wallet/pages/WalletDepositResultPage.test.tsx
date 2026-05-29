import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import { WalletDepositResultPage } from "./WalletDepositResultPage";
import { useDepositStatus } from "../hooks/useDepositStatus";

vi.mock("../hooks/useDepositStatus", () => ({
  useDepositStatus: vi.fn(),
}));

vi.mock("@/shared/lib/format", () => ({
  formatCurrencyVND: (value: number) => `${value} đ`,
  formatDateTime: (value: string | undefined) => value ?? "—",
}));

function renderPage(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/wallet/deposit/result" element={<WalletDepositResultPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("WalletDepositResultPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders fallback when txnRef is missing", () => {
    vi.mocked(useDepositStatus).mockReturnValue({
      data: undefined,
      isError: false,
    } as ReturnType<typeof useDepositStatus>);

    renderPage("/wallet/deposit/result");

    expect(screen.getByText("Không tìm thấy thông tin giao dịch")).toBeVisible();
    expect(screen.getByRole("link", { name: /quay lại ví/i })).toBeVisible();
  });

  it("does not render success from query string before backend confirms success", () => {
    vi.mocked(useDepositStatus).mockReturnValue({
      data: undefined,
      isError: false,
    } as ReturnType<typeof useDepositStatus>);

    renderPage("/wallet/deposit/result?txnRef=DEP001&status=SUCCESS");

    expect(screen.queryByText("Nạp tiền thành công")).not.toBeInTheDocument();
    expect(screen.getByText("Đang xác nhận giao dịch...")).toBeVisible();
  });

  it("renders success when backend deposit status is SUCCESS", () => {
    vi.mocked(useDepositStatus).mockReturnValue({
      data: {
        id: 1,
        txnRef: "DEP001",
        amount: 100000,
        status: "SUCCESS",
        vnpBankCode: "NCB",
        createdAt: "2026-05-28T01:00:00Z",
        paidAt: "2026-05-28T01:01:00Z",
      },
      isError: false,
    } as ReturnType<typeof useDepositStatus>);

    renderPage("/wallet/deposit/result?txnRef=DEP001&status=PENDING");

    expect(screen.getByText("Nạp tiền thành công")).toBeVisible();
    expect(screen.getByText("DEP001")).toBeVisible();
    expect(screen.getByText("100000 đ")).toBeVisible();
  });
});
