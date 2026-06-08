import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ShippingConfirmationForm } from "./ShippingConfirmationForm";

describe("ShippingConfirmationForm", () => {
  it("requires carrier and tracking code for third-party delivery", async () => {
    const onSubmit = vi.fn();
    render(<ShippingConfirmationForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: /xác nhận giao hàng/i }));

    expect(screen.getByText(/cần nhập đơn vị vận chuyển và mã vận đơn/i)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits third-party shipping metadata", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ShippingConfirmationForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByPlaceholderText(/đơn vị vận chuyển/i), "Viettel Post");
    await userEvent.type(screen.getByPlaceholderText(/mã vận đơn/i), "VT123");
    await userEvent.click(screen.getByRole("button", { name: /xác nhận giao hàng/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        deliveryMethod: "THIRD_PARTY",
        carrierName: "Viettel Post",
        trackingCode: "VT123",
      }),
    );
  });

  it("allows self delivery without tracking code", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ShippingConfirmationForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: /tự giao/i }));
    await userEvent.click(screen.getByRole("button", { name: /xác nhận giao hàng/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        deliveryMethod: "SELF_DELIVERY",
        carrierName: undefined,
        trackingCode: undefined,
      }),
    );
  });
});
