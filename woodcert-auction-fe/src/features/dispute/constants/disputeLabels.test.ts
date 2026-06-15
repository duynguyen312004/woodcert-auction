import { describe, expect, it } from "vitest";

import {
  DISPUTE_OUTCOME_LABEL,
  DISPUTE_STATUS_LABEL,
  isActiveDisputeStatus,
} from "./disputeLabels";

describe("dispute labels", () => {
  it("uses the approved Vietnamese labels for every status and outcome", () => {
    expect(DISPUTE_STATUS_LABEL).toEqual({
      OPEN: "Mới mở",
      UNDER_REVIEW: "Đang được xem xét",
      RESOLVED: "Đã giải quyết",
      REJECTED: "Đã từ chối",
      CANCELED: "Đã hủy",
    });
    expect(DISPUTE_OUTCOME_LABEL).toEqual({
      BUYER_WINS: "Người mua thắng - hoàn tiền",
      SELLER_WINS: "Người bán thắng - giải ngân",
    });
  });

  it("keeps only open and under-review cases writable", () => {
    expect(isActiveDisputeStatus("OPEN")).toBe(true);
    expect(isActiveDisputeStatus("UNDER_REVIEW")).toBe(true);
    expect(isActiveDisputeStatus("RESOLVED")).toBe(false);
    expect(isActiveDisputeStatus("REJECTED")).toBe(false);
    expect(isActiveDisputeStatus("CANCELED")).toBe(false);
  });
});
