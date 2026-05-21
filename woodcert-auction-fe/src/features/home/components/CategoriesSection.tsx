/**
 * Khu vực danh mục nổi bật ở trang chủ.
 *
 * Lấy vài danh mục từ catalog để dẫn người dùng sang luồng duyệt đấu giá.
 */
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { useCategories } from "@/features/catalog";

export function CategoriesSection() {
  const { data: categories, isLoading } = useCategories();
  const displayItems = categories?.slice(0, 4) ?? [];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Danh mục nổi bật
          </h2>
          <Link
            to="/auctions"
            className="group hidden items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:inline-flex"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Đang tải danh mục">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-lg bg-card/60" />
            ))}
          </div>
        ) : displayItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {displayItems.map((item) => (
              <Link
                key={item.id}
                to="/auctions"
                className="group flex min-h-44 flex-col justify-end rounded-lg border border-white/10 bg-card/60 p-6 transition-colors hover:border-primary/40"
              >
                <h4 className="font-serif text-lg font-bold text-foreground">{item.name}</h4>
                {item.description && (
                  <p className="mt-2 line-clamp-2 text-xs uppercase tracking-widest text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-card/40 p-8 text-sm text-muted-foreground">
            Chưa có danh mục để hiển thị.
          </div>
        )}
      </div>
    </section>
  );
}
