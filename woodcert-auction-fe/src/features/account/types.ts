import { z } from "zod";

// ── API response types ──────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  status: string;
  roles: string[];
  createdAt: string;
  hasSellerProfile: boolean;
}

export interface SellerProfile {
  userId: string;
  storeName: string;
  identityCardNumber: string;
  taxCode: string | null;
  reputationScore: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface AvatarUploadIntent {
  mediaId: number;
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  assetFolder: string;
  publicId: string;
  resourceType: string;
  timestamp: number;
  signature: string;
}

export interface AvatarUploadIntentPayload {
  originalFileName: string;
  contentType: string;
  fileSize: number;
}

// ── Zod schemas & inferred types ────────────────────────────────

const humanNameRegex = /^[\p{L}\s'.-]+$/u;
const vietnamesePhoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ và tên phải có từ 2 đến 100 ký tự.")
    .max(100, "Họ và tên phải có từ 2 đến 100 ký tự.")
    .regex(humanNameRegex, "Họ và tên chứa ký tự không hợp lệ."),
  phoneNumber: z
    .string()
    .max(20, "Số điện thoại không được vượt quá 20 ký tự.")
    .regex(vietnamesePhoneRegex, "Vui lòng nhập số điện thoại Việt Nam hợp lệ.")
    .or(z.literal("")),
});

export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
