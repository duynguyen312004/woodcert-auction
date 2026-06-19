import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GuidePage } from "./GuidePage";

describe("GuidePage", () => {
  it("explains the post-auction deadlines and their consequences", () => {
    render(<GuidePage />);

    expect(screen.getByText("72 giờ thanh toán")).toBeVisible();
    expect(screen.getByText("72 giờ xác nhận đã gửi")).toBeVisible();
    expect(screen.getByText("7 ngày phản hồi")).toBeVisible();
    expect(screen.getByText(/đây không phải hạn hàng phải tới nơi/i)).toBeVisible();
    expect(screen.getByText(/hệ thống tạm dừng payout/i)).toBeVisible();
    expect(screen.getByText(/đơn có thể tự động hoàn tất/i)).toBeVisible();
  });
});
