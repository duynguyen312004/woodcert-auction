/**
 * Kiểu dữ liệu và schema validate cho phần tài khoản.
 *
 * Các type mô phỏng dữ liệu backend trả về. Zod schema được dùng chung cho form
 * cập nhật profile và form đăng ký seller.
 */
import { z } from "zod";

// Kiểu dữ liệu API trả về.

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
  capabilityStatuses?: CapabilityStatus[];
}

export type UserCapability = "BUYER" | "SELLER" | "APPRAISER";
export type CapabilityState = "ACTIVE" | "BANNED";

export interface CapabilityStatus {
  capability: UserCapability;
  status: CapabilityState;
  reason: string | null;
  updatedAt: string | null;
}

export interface SellerProfile {
  userId: string;
  storeName: string;
  identityCardNumber: string;
  taxCode: string | null;
  reputationScore: number;
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

export interface Province {
  code: string;
  name: string;
}

export interface District {
  code: string;
  provinceCode: string;
  name: string;
}

export interface Ward {
  code: string;
  districtCode: string;
  name: string;
}

export interface Address {
  id: number;
  receiverName: string;
  phoneNumber: string;
  streetAddress: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  isDefault: boolean;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
}

export type CreateAddressPayload = Omit<
  Address,
  "id" | "provinceName" | "districtName" | "wardName"
>;

// Schema Zod và type suy ra từ schema.

const humanNameRegex = /^[\p{L}\s'.-]+$/u;

// Chấp nhận số Việt Nam dạng 0... hoặc +84...
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

const storeNameRegex = /^[\p{L}\d\s'.&-]+$/u;

// CMND thường có 9 số, CCCD thường có 12 số.
const identityCardNumberRegex = /^\d{9}(\d{3})?$/;

// Mã số thuế có thể để trống, 10 số hoặc dạng chi nhánh có hậu tố -NNN.
const taxCodeRegex = /^(\d{10}(-\d{3})?)?$/;

export const createSellerProfileSchema = z.object({
  storeName: z
    .string()
    .min(2, "Tên cửa hàng phải có từ 2 đến 100 ký tự.")
    .max(100, "Tên cửa hàng phải có từ 2 đến 100 ký tự.")
    .regex(storeNameRegex, "Tên cửa hàng chứa ký tự không hợp lệ."),
  identityCardNumber: z
    .string()
    .regex(identityCardNumberRegex, "CCCD/CMND phải gồm đúng 9 hoặc 12 chữ số."),
  taxCode: z
    .string()
    .max(50, "Mã số thuế không được vượt quá 50 ký tự.")
    .regex(taxCodeRegex, "Mã số thuế phải có 10 chữ số hoặc dạng chi nhánh hợp lệ."),
});

export type CreateSellerProfilePayload = z.infer<typeof createSellerProfileSchema>;
