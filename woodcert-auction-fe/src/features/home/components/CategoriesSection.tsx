import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import categoryRelief from "@/assets/images/mock/category-relief.webp";
import categorySculpture from "@/assets/images/mock/category-sculpture.webp";
import categorySpiritual from "@/assets/images/mock/category-spiritual.webp";
import categoryVases from "@/assets/images/mock/category-vases.webp";
import { useCategories } from "@/features/catalog";

const featuredCategorySlugs = [
  "tuong-dieu-khac-go",
  "tranh-phu-dieu-go",
  "do-tho-tam-linh",
  "binh-loc-binh-go",
] as const;

const categoryImages: Record<string, string> = {
  "tuong-dieu-khac-go": categorySculpture,
  "tranh-phu-dieu-go": categoryRelief,
  "do-tho-tam-linh": categorySpiritual,
  "binh-loc-binh-go": categoryVases,
};

export function getCategoryImage(slug: string): string {
  return categoryImages[slug.toLowerCase()] ?? categorySculpture;
}

export function CategoriesSection() {
  const { data: categories, isLoading } = useCategories();
  const displayItems =
    featuredCategorySlugs
      .map((slug) => categories?.find((category) => category.slug === slug))
      .filter((category) => category !== undefined) ?? [];

  return (
    <section className="py-24 relative overflow-hidden bg-background select-none">
      <div className="absolute right-0 top-1/4 h-[350px] w-[350px] rounded-full bg-primary/3 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Curated Collections
            </span>
            <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
              Danh mục nổi bật
            </h2>
          </div>
          <Link
            to="/auctions"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all duration-300 hover:text-primary/80"
          >
            Xem tất cả bộ sưu tập
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:grid-cols-4"
            aria-label="Đang tải danh mục"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-xl bg-card/60 border border-white/5"
              />
            ))}
          </div>
        ) : displayItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:grid-cols-4">
            {displayItems.map((item) => {
              const bgImg = getCategoryImage(item.slug);
              return (
                <Link
                  key={item.id}
                  to="/auctions"
                  className="group relative flex h-56 flex-col justify-end overflow-hidden rounded-xl border border-white/10 bg-card/40 p-6 transition-all duration-500 hover:border-primary/50 hover:shadow-[0_10px_25px_-5px_rgba(214,168,79,0.15)]"
                >
                  <img
                    src={bgImg}
                    alt={item.name}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10 z-[1] transition-opacity duration-300 group-hover:opacity-95" />

                  <div className="absolute top-4 right-4 z-10 h-3 w-3 border-t border-r border-primary/40 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0.5 group-hover:-translate-x-0.5" />
                  <div className="absolute bottom-4 left-4 z-10 h-3 w-3 border-b border-l border-primary/40 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />

                  <div className="relative z-10 transform transition-transform duration-300 will-change-transform group-hover:-translate-y-1">
                    <h4 className="font-serif text-xl font-bold text-white tracking-wide transition-colors group-hover:text-primary">
                      {item.name}
                    </h4>
                    {item.description ? (
                      <p className="mt-2 line-clamp-2 text-[11px] font-light uppercase tracking-widest text-white/60 group-hover:text-white/80 transition-colors">
                        {item.description}
                      </p>
                    ) : (
                      <p className="mt-2 text-[10px] font-light uppercase tracking-widest text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Khám phá tác phẩm →
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-[#121210]/40 p-8 text-center text-sm text-muted-foreground backdrop-blur-sm">
            Chưa có danh mục để hiển thị.
          </div>
        )}
      </div>
    </section>
  );
}
