/**
 * Badge trạng thái sản phẩm dùng lại trong seller.
 *
 * Dùng chung mapping nhãn và màu để bảng/card sản phẩm hiển thị thống nhất.
 */
import { PRODUCT_STATUS_CLASS, PRODUCT_STATUS_LABEL } from "../constants/productStatus";
import type { ProductStatus } from "../types";

import { cn } from "@/shared/lib/utils";

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight",
        PRODUCT_STATUS_CLASS[status],
      )}
    >
      {PRODUCT_STATUS_LABEL[status]}
    </span>
  );
}
