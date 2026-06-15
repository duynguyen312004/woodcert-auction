import type { DisputeAuthorRole, DisputeResolutionOutcome, DisputeStatus } from "../types";

export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = {
  OPEN: "Mới mở",
  UNDER_REVIEW: "Đang được xem xét",
  RESOLVED: "Đã giải quyết",
  REJECTED: "Đã từ chối",
  CANCELED: "Đã hủy",
};

export const DISPUTE_OUTCOME_LABEL: Record<DisputeResolutionOutcome, string> = {
  BUYER_WINS: "Người mua thắng - hoàn tiền",
  SELLER_WINS: "Người bán thắng - giải ngân",
};

export const DISPUTE_AUTHOR_LABEL: Record<DisputeAuthorRole, string> = {
  BUYER: "Người mua",
  SELLER: "Người bán",
  ADMIN: "Quản trị viên",
};

export function isActiveDisputeStatus(status: DisputeStatus) {
  return status === "OPEN" || status === "UNDER_REVIEW";
}
