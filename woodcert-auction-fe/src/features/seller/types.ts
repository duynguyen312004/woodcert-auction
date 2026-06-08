/**
 * Kiểu dữ liệu dùng trong khu seller.
 *
 * Dữ liệu này đã được đổi từ API để dùng cho dashboard, bảng sản phẩm và khối
 * phiên đang chạy. Type ở đây nhỏ hơn entity backend để giao diện dễ dùng hơn.
 */
import { z } from "zod";
import type { OrderSummary } from "@/features/order";
import { getServerNow } from "@/shared/lib/serverClock";

export type ProductStatus =
  | "DRAFT"
  | "PENDING_APPRAISAL"
  | "UNDER_APPRAISAL"
  | "REJECTED"
  | "APPRAISED";

export type ProductSaleStatus = "AVAILABLE" | "IN_AUCTION" | "PENDING_ORDER" | "SOLD" | "RETURNED";

export type SellerAuctionStatus =
  | "WAITING"
  | "ACTIVE"
  | "ENDED_SUCCESS"
  | "ENDED_FAILED"
  | "CANCELED";

export type SellerAuctionSettlementStatus = "NOT_APPLICABLE" | "PENDING" | "SETTLED";

export interface SellerAuctionSettlementSummary {
  frozen: number;
  withdrawn: number;
  refunded: number;
  deducted: number;
  confiscated: number;
}

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

export interface SellerProductStats {
  total: number;
  byStatus: Record<ProductStatus, number>;
  bySaleStatus: Record<ProductSaleStatus, number>;
}

export interface SellerAuction {
  id: string;
  title: string;
  productId: string;
  status: SellerAuctionStatus;
  startingPrice: number;
  currentPrice: number;
  depositAmount: number;
  bidCount: number;
  startTime: string;
  endTime: string;
  imageUrl: string | null;
  createdAt: string;
}

/**
 * Thống kê số phiên đấu giá theo từng trạng thái, trả về từ GET /auctions/me/stats.
 * Payload nhỏ gọn và chính xác hơn so với việc đếm thủ công từ danh sách.
 */
export interface SellerAuctionStats {
  waiting: number;
  active: number;
  endedSuccess: number;
  endedFailed: number;
  canceled: number;
}

export interface SellerAuctionProductSummary {
  id: number;
  title: string;
  description: string | null;
  material: string | null;
  dimensions: string | null;
  weight: number | string | null;
  primaryImage: string | null;
  images: string[];
  appraisal: {
    certificateCode: string | null;
    verifiedMaterial: string | null;
    origin: string | null;
    ageEstimation: string | null;
    conditionGrade: string | null;
    estimatedValue: number | string | null;
    isAuthentic: boolean;
  } | null;
}

export interface SellerAuctionDetail {
  id: string;
  status: SellerAuctionStatus;
  startingPrice: number;
  reservePrice: number;
  stepPrice: number;
  depositAmount: number;
  currentPrice: number;
  finalPrice: number | null;
  startTime: string;
  endTime: string;
  participantCount: number;
  winnerMaskedAlias: string | null;
  settlementStatus: SellerAuctionSettlementStatus;
  settlement: SellerAuctionSettlementSummary;
  order?: OrderSummary | null;
  product: SellerAuctionProductSummary;
  createdAt: string;
  updatedAt: string;
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

export type ConditionGrade = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export interface AppraisalProofImage {
  id: number;
  mediaId: number;
  description: string | null;
  imageUrl: string | null;
}

export interface SellerAppraisalReport {
  certificateCode: string;
  verifiedMaterial: string;
  origin: string | null;
  ageEstimation: string | null;
  conditionGrade: ConditionGrade | null;
  estimatedValue: number | string;
  isAuthentic: boolean;
  digitalSignature: string;
  appraisedAt: string;
  appraiserNotes: string | null;
  sellerAccuracy: number | string | null;
  proofImages: AppraisalProofImage[];
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
  appraisalReport: SellerAppraisalReport | null;
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

// Rule tạo phiên phải khớp AuctionPolicy ở backend để seller nhận lỗi ngay trên form.
const auctionMoneyField = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName} không được để trống`)
    .refine((value) => {
      const parsed = numberFromForm(value);
      return Number.isFinite(parsed) && parsed > 0;
    }, `${fieldName} phải lớn hơn 0`);

function numberFromForm(value: string) {
  const parsed = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateFromLocalInput(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const createAuctionSessionSchema = z
  .object({
    productId: z.number().int().positive("Vui lòng chọn sản phẩm"),
    startingPrice: auctionMoneyField("Giá khởi điểm"),
    reservePrice: auctionMoneyField("Giá sàn"),
    stepPrice: auctionMoneyField("Bước giá"),
    depositAmount: auctionMoneyField("Tiền cọc"),
    startTime: z.string().min(1, "Vui lòng chọn thời gian bắt đầu"),
    endTime: z.string().min(1, "Vui lòng chọn thời gian kết thúc"),
  })
  .superRefine((values, ctx) => {
    const startingPrice = numberFromForm(values.startingPrice);
    const reservePrice = numberFromForm(values.reservePrice);
    const stepPrice = numberFromForm(values.stepPrice);
    const depositAmount = numberFromForm(values.depositAmount);
    const startTime = dateFromLocalInput(values.startTime);
    const endTime = dateFromLocalInput(values.endTime);

    if (reservePrice < startingPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["reservePrice"],
        message: "Giá sàn phải lớn hơn hoặc bằng giá khởi điểm",
      });
    }

    if (stepPrice < 100000) {
      ctx.addIssue({
        code: "custom",
        path: ["stepPrice"],
        message: "Bước giá tối thiểu là 100.000 đ",
      });
    }

    if (depositAmount < 1000000 || depositAmount > startingPrice * 0.5) {
      ctx.addIssue({
        code: "custom",
        path: ["depositAmount"],
        message: "Tiền cọc phải từ 1.000.000 đ đến tối đa 50% giá khởi điểm",
      });
    }

    if (!startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Thời gian bắt đầu không hợp lệ",
      });
      return;
    }

    if (!endTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Thời gian kết thúc không hợp lệ",
      });
      return;
    }

    if (startTime.getTime() < getServerNow() + 5 * 60 * 1000) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Thời gian bắt đầu phải cách hiện tại ít nhất 5 phút",
      });
    }

    const durationMs = endTime.getTime() - startTime.getTime();
    if (durationMs < 60 * 60 * 1000 || durationMs > 30 * 24 * 60 * 60 * 1000) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Thời lượng phiên phải từ 1 giờ đến 30 ngày",
      });
    }
  });

export type CreateAuctionSessionFormValues = z.infer<typeof createAuctionSessionSchema>;

export interface CreateAuctionSessionPayload {
  productId: number;
  startingPrice: number;
  reservePrice: number;
  stepPrice: number;
  depositAmount: number;
  startTime: string;
  endTime: string;
}
