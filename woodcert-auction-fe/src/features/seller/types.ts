/**
 * Kiểu dữ liệu dùng trong khu seller.
 *
 * Dữ liệu này đã được đổi từ API để dùng cho dashboard, bảng sản phẩm và khối
 * phiên đang chạy. Type ở đây nhỏ hơn entity backend để giao diện dễ dùng hơn.
 */
import { z } from "zod";

export type ProductStatus =
  | "DRAFT"
  | "PENDING_APPRAISAL"
  | "UNDER_APPRAISAL"
  | "REJECTED"
  | "APPRAISED";

export type ProductSaleStatus = "AVAILABLE" | "IN_AUCTION" | "SOLD";

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
  saleStatus: ProductSaleStatus;
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

export interface ProductImagePayload {
  mediaId: number;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductDetailImage {
  id: number;
  mediaId: number;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductDetail {
  id: number;
  title: string;
  description: string | null;
  material: string | null;
  dimensions: string | null;
  weight: number | string | null;
  status: ProductStatus;
  saleStatus: ProductSaleStatus;
  category: {
    id: number;
    name: string;
    slug?: string;
    parentId?: number | null;
    description?: string | null;
  } | null;
  images: ProductDetailImage[];
  submittedAt?: string | null;
  appraisalClaimedBy?: string | null;
  appraisalClaimedAt?: string | null;
  appraisalClaimExpiresAt?: string | null;
  rejectedReason?: string | null;
  createdAt: string;
}

export const createProductSchema = z.object({
  categoryId: z.number().int().positive("Vui lòng chọn danh mục"),
  title: z
    .string()
    .min(1, "Tên sản phẩm không được để trống")
    .max(255, "Tên sản phẩm tối đa 255 ký tự"),
  description: z.string().optional(),
  material: z.string().max(100, "Chất liệu tối đa 100 ký tự").optional().or(z.literal("")),
  dimensions: z.string().max(100, "Kích thước tối đa 100 ký tự").optional().or(z.literal("")),
  weight: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0.01), "Khối lượng phải lớn hơn 0")
    .or(z.literal("")),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;

export interface CreateProductPayload {
  categoryId: number;
  title: string;
  description?: string;
  material?: string;
  dimensions?: string;
  weight?: number;
  images: ProductImagePayload[];
}

export type UpdateProductPayload = CreateProductPayload;
