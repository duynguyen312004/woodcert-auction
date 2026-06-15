export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED" | "CANCELED";

export type DisputeResolutionOutcome = "SELLER_WINS" | "BUYER_WINS";

export type DisputeAuthorRole = "BUYER" | "SELLER" | "ADMIN";

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

export interface DisputeMessage {
  id: number;
  authorRole: DisputeAuthorRole;
  content: string | null;
  createdAt: string;
  evidence: DisputeEvidence[];
}

export interface DisputeDetail {
  dispute: DisputeCase;
  messages: DisputeMessage[];
}

export interface CreateDisputePayload {
  reason: string;
  description?: string;
  evidenceMediaIds: number[];
}

export interface CreateDisputeMessagePayload {
  content?: string;
  evidenceMediaIds: number[];
}
