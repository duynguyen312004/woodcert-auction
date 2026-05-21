/**
 * Trang tạm cho các mục seller chưa làm xong.
 *
 * Dùng để giữ sẵn cấu trúc route và luồng điều hướng trong khi các màn CRUD
 * chưa được triển khai.
 */
import { ArrowLeft, Hammer } from "lucide-react";
import { Link } from "react-router";

import { SELLER_PATHS } from "../constants/routes";

interface SellerPlaceholderPageProps {
  title: string;
  description: string;
}

export function SellerPlaceholderPage({ title, description }: SellerPlaceholderPageProps) {
  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <section className="w-full max-w-2xl rounded-lg border border-[#4e4637]/20 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brushed-brass/15 text-brushed-brass">
          <Hammer className="size-6" aria-hidden />
        </div>
        <h1 className="mt-5 font-serif text-2xl font-bold text-ink-blue">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-warm">{description}</p>
        <Link
          to={SELLER_PATHS.dashboard}
          className="mt-6 inline-flex items-center gap-2 rounded border border-ink-blue/20 px-4 py-2 text-sm font-semibold text-ink-blue transition-colors hover:bg-ink-blue/5"
        >
          <ArrowLeft className="size-4" />
          Về dashboard
        </Link>
      </section>
    </div>
  );
}
