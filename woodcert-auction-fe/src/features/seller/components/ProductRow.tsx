/**
 * Dòng sản phẩm trong bảng dashboard seller.
 *
 * Hiển thị ảnh, tên, chất liệu, trạng thái và nút thao tác cho sản phẩm gần đây.
 */
import { MoreHorizontal, PackagePlus } from "lucide-react";
import { useState } from "react";

import type { SellerProduct } from "../types";
import { ProductSaleStatusBadge, ProductStatusBadge } from "./ProductStatusBadge";

export function ProductRow({ product }: { product: SellerProduct }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <tr className="transition-colors hover:bg-[#F6F0E6]/60">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="size-12 shrink-0 overflow-hidden rounded border border-[#4e4637]/20 bg-[#eae1d6] bg-cover bg-center">
            {product.imageUrl && !imgFailed ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="size-full object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <PackagePlus className="size-5 text-[#8D877C]" />
              </div>
            )}
          </div>
          <p className="text-sm font-bold text-ink-blue">{product.title}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-warm">{product.woodType || "—"}</td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1.5">
          <ProductStatusBadge status={product.status} />
          {product.saleStatus !== "AVAILABLE" && (
            <ProductSaleStatusBadge status={product.saleStatus} />
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          type="button"
          className="cursor-pointer text-ink-blue/40 transition-colors hover:text-brushed-brass"
          aria-label={`Thao tác cho ${product.title}`}
        >
          <MoreHorizontal className="size-5" />
        </button>
      </td>
    </tr>
  );
}
