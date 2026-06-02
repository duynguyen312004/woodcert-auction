export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED" | "CANCELED";

export interface DisputeCase {
  id: number;
  orderId: number;
  fulfillmentId: number | null;
  openedByUserId: string;
  status: DisputeStatus;
  reason: string;
  description: string | null;
  openedAt: string;
  resolvedAt: string | null;
}
