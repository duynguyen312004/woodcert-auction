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

export interface AuctionProductAppraisal {
  certificateCode: string | null;
  verifiedMaterial: string | null;
  origin: string | null;
  ageEstimation: string | null;
  conditionGrade: string | null;
  estimatedValue: number | null;
  isAuthentic: boolean;
}

export interface AuctionProductSummary {
  id: number;
  title: string;
  description: string | null;
  material: string | null;
  dimensions: string | null;
  weight: number | null;
  primaryImage: string | null;
  imageUrls: string[];
  certificateCode: string | null;
  isAuthentic: boolean;
  appraisal: AuctionProductAppraisal | null;
}

export interface AuctionSellerSummary {
  storeName: string;
  reputationScore: number;
}

export interface AuctionDetail {
  id: number;
  status: AuctionStatus;
  startingPrice: number;
  currentPrice: number;
  stepPrice: number;
  depositAmount: number;
  startTime: string;
  endTime: string;
  product: AuctionProductSummary | null;
  seller: AuctionSellerSummary | null;
  highestBidderMaskedAlias: string | null;
}

export type AuctionFilters = {
  status?: AuctionStatus;
  categoryName?: string;
  materials?: string[];
  priceMin?: number;
  priceMax?: number;
};
