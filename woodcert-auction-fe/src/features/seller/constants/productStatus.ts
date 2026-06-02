/**
 * Cách hiển thị trạng thái sản phẩm trong màn seller/appraiser.
 */
import type { ProductSaleStatus, ProductStatus } from "../types";

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING_APPRAISAL: "Chờ kiểm định",
  UNDER_APPRAISAL: "Đang kiểm định",
  REJECTED: "Bị từ chối",
  APPRAISED: "Đã kiểm định",
};

export const PRODUCT_STATUS_CLASS: Record<ProductStatus, string> = {
  DRAFT: "bg-[#8D877C]/10 text-[#8D877C] border border-[#8D877C]/20",
  PENDING_APPRAISAL: "bg-[#D6A84F]/10 text-[#D6A84F] border border-[#D6A84F]/20",
  UNDER_APPRAISAL: "bg-[#2E4A62]/10 text-[#2E4A62] border border-[#2E4A62]/20",
  REJECTED: "bg-red-500/10 text-red-600 border border-red-500/20",
  APPRAISED: "bg-[#2F7D68]/10 text-[#2F7D68] border border-[#2F7D68]/20",
};

export const PRODUCT_SALE_STATUS_LABEL: Record<ProductSaleStatus, string> = {
  AVAILABLE: "Sẵn sàng đấu giá",
  IN_AUCTION: "Đang đấu giá",
  PENDING_ORDER: "Chờ hoàn tất đơn",
  SOLD: "Đã bán",
};

export const PRODUCT_SALE_STATUS_CLASS: Record<ProductSaleStatus, string> = {
  AVAILABLE: "bg-[#2F7D68]/10 text-[#2F7D68] border border-[#2F7D68]/20",
  IN_AUCTION: "bg-[#2E4A62]/10 text-[#2E4A62] border border-[#2E4A62]/20",
  PENDING_ORDER: "bg-[#D6A84F]/10 text-[#956400] border border-[#D6A84F]/25",
  SOLD: "bg-[#181612]/10 text-[#181612] border border-[#181612]/20",
};
