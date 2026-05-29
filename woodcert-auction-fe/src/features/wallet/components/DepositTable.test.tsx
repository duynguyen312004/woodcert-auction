import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { VnPayDeposit } from "../api/wallet";
import { DepositTable } from "./DepositTable";

vi.mock("@/shared/lib/format", () => ({
  formatCurrencyVND: (value: number) => `${value} đ`,
  formatDateTime: (value: string | undefined) => value ?? "—",
}));

function makeDeposit(overrides: Partial<VnPayDeposit> = {}): VnPayDeposit {
  return {
    id: 1,
    txnRef: "DEP202605280001",
    amount: 100000,
    status: "SUCCESS",
    vnpBankCode: "NCB",
    createdAt: "2026-05-28T01:00:00Z",
    paidAt: "2026-05-28T01:01:00Z",
    ...overrides,
  };
}

describe("DepositTable", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders empty state when there are no deposits", () => {
    render(
      <DepositTable
        deposits={[]}
        isLoading={false}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Chưa có giao dịch nạp tiền VNPay nào.")).toBeVisible();
  });

  it("renders deposit rows with status badges", () => {
    render(
      <DepositTable
        deposits={[
          makeDeposit({ id: 1, status: "SUCCESS" }),
          makeDeposit({ id: 2, txnRef: "DEP202605280002", status: "PENDING", vnpBankCode: null }),
          makeDeposit({ id: 3, txnRef: "DEP202605280003", status: "FAILED" }),
        ]}
        isLoading={false}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("DEP202605280001")).toBeVisible();
    expect(screen.getByText("DEP202605280002")).toBeVisible();
    expect(screen.getByText("DEP202605280003")).toBeVisible();
    expect(screen.getByText("Thành công")).toBeVisible();
    expect(screen.getByText("Đang xử lý")).toBeVisible();
    expect(screen.getByText("Thất bại")).toBeVisible();
  });

  it("calls pagination callbacks", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DepositTable
        deposits={[makeDeposit()]}
        isLoading={false}
        page={2}
        totalPages={3}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /trước/i }));
    await user.click(screen.getByRole("button", { name: /sau/i }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });
});
