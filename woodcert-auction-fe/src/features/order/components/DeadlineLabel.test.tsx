import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeadlineLabel } from "./DeadlineLabel";

describe("DeadlineLabel", () => {
  it("provides an accessible explanation for a financial deadline", () => {
    render(
      <DeadlineLabel
        label="Đơn tự động hoàn tất lúc"
        explanation="Đơn sẽ hoàn tất và thanh toán cho Seller."
      />,
    );

    expect(screen.getByText("Đơn tự động hoàn tất lúc")).toBeVisible();
    expect(
      screen.getByRole("button", { name: /giải thích: đơn tự động hoàn tất lúc/i }),
    ).toBeVisible();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Đơn sẽ hoàn tất và thanh toán cho Seller.",
    );
  });
});
