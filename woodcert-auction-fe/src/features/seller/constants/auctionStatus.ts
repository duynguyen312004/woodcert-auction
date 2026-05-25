/**
 * Nhãn và màu trạng thái phiên đấu giá trong khu seller.
 */
import type { SellerAuctionStatus } from "../types";

export const SELLER_AUCTION_STATUS_LABEL: Record<SellerAuctionStatus, string> = {
  WAITING: "Sắp diễn ra",
  ACTIVE: "Đang diễn ra",
  ENDED_SUCCESS: "Đã chốt bán",
  ENDED_FAILED: "Không đạt giá sàn",
  CANCELED: "Đã hủy",
};

export const SELLER_AUCTION_STATUS_CLASS: Record<SellerAuctionStatus, string> = {
  WAITING: "bg-[#D6A84F]/10 text-[#9A6B08] border border-[#D6A84F]/25",
  ACTIVE: "bg-[#C6533D]/10 text-[#C6533D] border border-[#C6533D]/25",
  ENDED_SUCCESS: "bg-[#2F7D68]/10 text-[#2F7D68] border border-[#2F7D68]/25",
  ENDED_FAILED: "bg-[#8D877C]/10 text-[#6F675B] border border-[#8D877C]/25",
  CANCELED: "bg-red-500/10 text-red-600 border border-red-500/25",
};
