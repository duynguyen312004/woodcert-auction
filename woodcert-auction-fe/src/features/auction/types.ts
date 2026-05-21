/**
 * Kiểu dữ liệu đấu giá dùng ở giao diện.
 *
 * Đây là dữ liệu đã được map cho card, danh sách, bộ lọc và các widget cần tóm
 * tắt phiên đấu giá.
 */
export type AuctionStatus = "WAITING" | "ACTIVE" | "ENDED_SUCCESS" | "ENDED_FAILED" | "CANCELED";

export type ConditionGrade = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export interface ArtAuction {
  id: string;
  title: string;
  status: AuctionStatus;
  startingPrice: number;
  currentPrice: number;
  bidCount: number;
  startTime: string;
  endTime: string;
  imageUrl: string;
  woodType: string;
  conditionGrade: ConditionGrade;
  categoryName: string;
  isAuthentic: boolean;
  certificationScore?: number;
  sellerName: string;
  sellerRating?: number;
}

export type AuctionFilters = {
  status?: AuctionStatus;
  categoryName?: string;
  woodType?: string;
  materials?: string[];
  priceMin?: number;
  priceMax?: number;
};
