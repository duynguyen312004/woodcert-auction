/**
 * Banner giải thích trạng thái read-only khi quyền bán bị admin đình chỉ.
 */
import { ShieldAlert } from "lucide-react";

import { formatDateTime } from "@/shared/lib/format";

import { useSellerCapability } from "./SellerCapabilityProvider";

export function SellerCapabilityBanner() {
  const { isSuspended, reason, updatedAt } = useSellerCapability();

  if (!isSuspended) return null;

  return (
    <section
      role="status"
      className="shrink-0 border-b border-amber-300/60 bg-amber-50 px-5 py-3 text-amber-950"
    >
      <div className="mx-auto flex max-w-[1280px] items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-bold">Quyền bán đang bị đình chỉ</p>
          <p className="mt-0.5 text-sm leading-5">
            Bạn vẫn có thể xem dữ liệu và hoàn tất giao hàng, nhưng không thể tạo hoặc thay đổi sản
            phẩm và phiên đấu giá.
          </p>
          {reason && <p className="mt-1 text-sm font-semibold">Lý do: {reason}</p>}
          {updatedAt && (
            <p className="mt-0.5 text-xs text-amber-800">
              Cập nhật lúc {formatDateTime(updatedAt)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
