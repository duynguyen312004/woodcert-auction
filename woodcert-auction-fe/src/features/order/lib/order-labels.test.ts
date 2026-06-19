import { describe, expect, it } from "vitest";

import { getCancelReasonText, isShipmentDeadlineExceeded } from "./order-labels";

describe("order labels", () => {
  it("labels shipment deadline cancellation for both order participants", () => {
    expect(getCancelReasonText("SHIPMENT_DEADLINE_EXCEEDED")).toContain("Seller quá hạn");
  });

  it("compares the shipment deadline against the supplied server time", () => {
    const now = Date.parse("2026-06-19T00:00:00Z");

    expect(isShipmentDeadlineExceeded("2026-06-18T23:59:59Z", now)).toBe(true);
    expect(isShipmentDeadlineExceeded("2026-06-19T00:00:01Z", now)).toBe(false);
    expect(isShipmentDeadlineExceeded(null, now)).toBe(false);
  });
});
