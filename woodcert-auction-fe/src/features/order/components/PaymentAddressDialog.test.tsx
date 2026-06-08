import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { useAddresses } from "@/features/account";

import type { OrderSummary } from "../types";
import { PaymentAddressDialog } from "./PaymentAddressDialog";

vi.mock("@/features/account", () => ({
  useAddresses: vi.fn(),
}));

const order = {
  id: 91,
  sourceType: "AUCTION",
  sourceId: 501,
  status: "PENDING_PAYMENT",
  finalPrice: 10_000_000,
  depositAmount: 1_000_000,
  remainingAmount: 9_000_000,
  platformCommissionRate: null,
  platformCommissionAmount: null,
  sellerPayoutAmount: null,
  forfeitedDepositPlatformFeeAmount: null,
  forfeitedDepositSellerAmount: null,
  paymentDeadline: null,
  paidAt: null,
  completedAt: null,
  canceledAt: null,
  cancelReason: null,
  fulfillment: null,
  createdAt: "2026-06-06T10:00:00Z",
} satisfies OrderSummary;

describe("PaymentAddressDialog", () => {
  it("selects the default address and confirms it", async () => {
    vi.mocked(useAddresses).mockReturnValue({
      data: [
        {
          id: 3,
          receiverName: "Nguyen Van A",
          phoneNumber: "0911222333",
          streetAddress: "12 Le Loi",
          provinceCode: "01",
          districtCode: "001",
          wardCode: "00001",
          provinceName: "Ha Noi",
          districtName: "Ba Dinh",
          wardName: "Phuc Xa",
          isDefault: true,
        },
      ],
      isPending: false,
    } as unknown as ReturnType<typeof useAddresses>);
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <PaymentAddressDialog
          order={order}
          isPending={false}
          onOpenChange={vi.fn()}
          onConfirm={onConfirm}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("radio")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: /xác nhận thanh toán/i }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(3));
  });

  it("requires an address before payment", () => {
    vi.mocked(useAddresses).mockReturnValue({
      data: [],
      isPending: false,
    } as unknown as ReturnType<typeof useAddresses>);

    render(
      <MemoryRouter>
        <PaymentAddressDialog
          order={order}
          isPending={false}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/cần thêm địa chỉ/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /xác nhận thanh toán/i })).toBeDisabled();
  });
});
