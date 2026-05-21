/**
 * Kiểu dữ liệu dùng trong khu seller.
 *
 * Dữ liệu này đã được đổi từ API để dùng cho dashboard, bảng sản phẩm và khối
 * phiên đang chạy. Type ở đây nhỏ hơn entity backend để giao diện dễ dùng hơn.
 */
export type ProductStatus = "DRAFT" | "PENDING_APPRAISAL" | "APPRAISED" | "IN_AUCTION";
export type SellerAuctionStatus =
  | "WAITING"
  | "ACTIVE"
  | "ENDED_SUCCESS"
  | "ENDED_FAILED"
  | "CANCELED";

export interface SellerProduct {
  id: string;
  title: string;
  woodType: string | null;
  status: ProductStatus;
  imageUrl: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface SellerAuction {
  id: string;
  title: string;
  status: SellerAuctionStatus;
  currentPrice: number;
  bidCount: number;
  startTime: string;
  endTime: string;
  imageUrl: string | null;
}
