/**
 * Nhãn và mapping trạng thái đấu giá cho UI.
 *
 * Backend có nhiều trạng thái chi tiết hơn, còn UI public chỉ cần vài tab/filter
 * chính. Gom ở đây để card và page dùng chung một cách hiển thị.
 */
import type { AuctionStatus } from "../types";

export type AuctionStatusFilter = Extract<AuctionStatus, "ACTIVE" | "WAITING">;
export type AuctionStatusTab = "ALL" | "ACTIVE" | "WAITING" | "ENDED";

export const AUCTION_STATUS_LABEL: Record<AuctionStatus, string> = {
  WAITING: "Sắp mở",
  ACTIVE: "Đang đấu giá",
  ENDED_SUCCESS: "Đã kết thúc",
  ENDED_FAILED: "Đã kết thúc",
  CANCELED: "Đã hủy",
};

export const AUCTION_STATUS_FILTER_OPTIONS: {
  value: AuctionStatusFilter;
  label: string;
}[] = [
  { value: "ACTIVE", label: AUCTION_STATUS_LABEL.ACTIVE },
  { value: "WAITING", label: AUCTION_STATUS_LABEL.WAITING },
];

export const AUCTION_STATUS_TABS: { id: AuctionStatusTab; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "ACTIVE", label: AUCTION_STATUS_LABEL.ACTIVE },
  { id: "WAITING", label: AUCTION_STATUS_LABEL.WAITING },
  { id: "ENDED", label: "Đã chốt" },
];

export function auctionTabToStatus(tab: AuctionStatusTab): AuctionStatus | undefined {
  // Tab đã chốt chỉ lấy phiên kết thúc thành công; phiên hủy/thất bại không đưa vào browse public.
  if (tab === "ACTIVE") return "ACTIVE";
  if (tab === "WAITING") return "WAITING";
  if (tab === "ENDED") return "ENDED_SUCCESS";
  return undefined;
}
