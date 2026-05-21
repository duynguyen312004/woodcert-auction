/**
 * Cách hiển thị trạng thái sản phẩm trong màn seller.
 *
 * Gom nhãn tiếng Việt và màu badge ở đây để bảng, card và form sau này dùng
 * thống nhất.
 */
import type { ProductStatus } from "../types";

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING_APPRAISAL: "Chờ kiểm định",
  APPRAISED: "Đã kiểm định",
  IN_AUCTION: "Đang đấu giá",
};

export const PRODUCT_STATUS_CLASS: Record<ProductStatus, string> = {
  DRAFT: "bg-[#8D877C]/10 text-[#8D877C] border border-[#8D877C]/20",
  PENDING_APPRAISAL: "bg-[#D6A84F]/10 text-[#D6A84F] border border-[#D6A84F]/20",
  APPRAISED: "bg-[#2F7D68]/10 text-[#2F7D68] border border-[#2F7D68]/20",
  IN_AUCTION: "bg-[#2E4A62]/10 text-[#2E4A62] border border-[#2E4A62]/20",
};
