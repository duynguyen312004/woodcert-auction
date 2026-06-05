import type { DisputeResolutionOutcome, DisputeStatus } from "@/features/dispute";

export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = {
  OPEN: "Mới mở",
  UNDER_REVIEW: "Đang xử lý",
  RESOLVED: "Đã xử lý",
  REJECTED: "Từ chối",
  CANCELED: "Đã hủy",
};

export const DISPUTE_OUTCOME_LABEL: Record<DisputeResolutionOutcome, string> = {
  BUYER_WINS: "Buyer thắng (hoàn tiền)",
  SELLER_WINS: "Seller thắng (giải ngân)",
};
