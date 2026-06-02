export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED" | "CANCELED";

export type DisputeResolutionOutcome = "SELLER_WINS" | "BUYER_WINS";

export interface DisputeEvidence {
  id: number;
  mediaId: number;
  url: string | null;
  originalFilename: string | null;
  sortOrder: number;
}

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
  resolvedByAdminId: string | null;
  resolutionOutcome: DisputeResolutionOutcome | null;
  resolutionNote: string | null;
  evidence: DisputeEvidence[];
}

export interface CreateDisputePayload {
  reason: string;
  description?: string;
  evidenceMediaIds: number[];
}
