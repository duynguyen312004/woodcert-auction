/**
 * Chặn các route tạo/sửa khi seller portal đang ở chế độ chỉ đọc.
 */
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "@/shared/ui/button";

import { SELLER_PATHS } from "../constants/routes";
import { useSellerCapability } from "./SellerCapabilityProvider";

export function SellerWriteAccessGuard({ children }: { children: ReactNode }) {
  const { isSuspended, reason } = useSellerCapability();

  if (!isSuspended) return children;

  return (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-warm-ivory p-8">
      <section className="w-full max-w-md rounded-xl border border-amber-300/60 bg-white p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto size-11 text-amber-700" aria-hidden />
        <h1 className="mt-5 font-serif text-xl font-bold text-ink-blue">
          Quyền bán đang bị đình chỉ
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-warm">
          Thao tác tạo hoặc chỉnh sửa đã bị khóa. Dữ liệu lịch sử của bạn vẫn được giữ nguyên.
        </p>
        {reason && <p className="mt-3 text-sm font-semibold text-amber-800">Lý do: {reason}</p>}
        <Button asChild className="mt-6 bg-ink-blue text-white hover:bg-ink-blue/90">
          <Link to={SELLER_PATHS.dashboard}>Về tổng quan</Link>
        </Button>
      </section>
    </div>
  );
}
