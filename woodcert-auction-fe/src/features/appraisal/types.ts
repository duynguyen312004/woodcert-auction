/**
 * Kiểu dữ liệu dùng trong khu appraiser.
 */
import { z } from "zod";

export type ConditionGrade = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export type AppraisalProductStatus =
  | "DRAFT"
  | "PENDING_APPRAISAL"
  | "UNDER_APPRAISAL"
  | "REJECTED"
  | "APPRAISED";

export interface AppraisalQueueItem {
  id: number;
  title: string;
  category: { id: number; name: string } | null;
  material: string | null;
  status: AppraisalProductStatus;
  primaryImage: string | null;
  createdAt: string;
  submittedAt: string | null;
  appraisalClaimedBy: string | null;
  appraisalClaimedAt: string | null;
  appraisalClaimExpiresAt: string | null;
}

export interface AppraisalProofImageDetail {
  id: number;
  mediaId: number;
  description: string | null;
  imageUrl: string | null;
}

export interface AppraisalReportDetail {
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
  proofImages: AppraisalProofImageDetail[];
}

export interface AppraisalProductImage {
  id: number;
  mediaId: number;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface AppraisalSellerSummary {
  id: string;
  fullName: string;
  storeName?: string | null;
}

export interface AppraisalProductDetail {
  id: number;
  seller: AppraisalSellerSummary | null;
  title: string;
  description: string | null;
  material: string | null;
  dimensions: string | null;
  weight: number | string | null;
  status: AppraisalProductStatus;
  category: { id: number; name: string } | null;
  images: AppraisalProductImage[];
  appraisalReport: AppraisalReportDetail | null;
  submittedAt: string | null;
  appraisalClaimedBy: string | null;
  appraisalClaimedAt: string | null;
  appraisalClaimExpiresAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
}

export interface AppraisalProofImagePayload {
  mediaId: number;
  description?: string;
}

export interface CreateAppraisalPayload {
  isAuthentic: boolean;
  verifiedMaterial: string;
  origin?: string;
  ageEstimation?: string;
  conditionGrade?: ConditionGrade;
  estimatedValue: number;
  appraiserNotes?: string;
  sellerAccuracy: number;
  proofImages?: AppraisalProofImagePayload[];
}

export interface AppraisalSubmitResult {
  reportId: number;
  productId: number;
  certificateCode: string;
  newProductStatus: AppraisalProductStatus;
}

export const CONDITION_GRADE_LABEL: Record<ConditionGrade, string> = {
  EXCELLENT: "Xuất sắc",
  GOOD: "Tốt",
  FAIR: "Bình thường",
  POOR: "Kém",
};

export const appraisalFormSchema = z
  .object({
    isAuthentic: z.boolean(),
    verifiedMaterial: z
      .string()
      .min(1, "Vật liệu xác minh không được để trống")
      .max(100, "Vật liệu xác minh tối đa 100 ký tự"),
    origin: z.string().max(100, "Xuất xứ tối đa 100 ký tự").optional().or(z.literal("")),
    ageEstimation: z.string().max(50, "Ước tính tuổi tối đa 50 ký tự").optional().or(z.literal("")),
    conditionGrade: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR"]).optional(),
    estimatedValue: z
      .string()
      .refine((v) => v !== "" && !isNaN(Number(v)) && Number(v) >= 0, "Giá trị ước tính phải >= 0"),
    appraiserNotes: z.string().optional().or(z.literal("")),
    sellerAccuracy: z
      .string()
      .min(1, "Độ chính xác seller là bắt buộc")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 5,
        "Độ chính xác seller phải từ 1 đến 5",
      ),
  })
  .superRefine((data, ctx) => {
    if (!data.isAuthentic && (!data.appraiserNotes || data.appraiserNotes.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appraiserNotes"],
        message: "Ghi chú là bắt buộc khi từ chối sản phẩm",
      });
    }
  });

export type AppraisalFormValues = z.infer<typeof appraisalFormSchema>;
