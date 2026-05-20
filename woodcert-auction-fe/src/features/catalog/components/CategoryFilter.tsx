import { cn } from "@/shared/lib/utils";

import { useCategories } from "../hooks/useCategories";

type CategoryFilterProps = {
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
};

export function CategoryFilter({ value, onChange, allLabel = "Tất cả" }: CategoryFilterProps) {
  const { data: categories = [], isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-muted"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Lọc theo danh mục"
      className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
    >
      <button
        type="button"
        onClick={() => onChange("")}
        className={cn(
          "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
          value === ""
            ? "pill-filter-active border-primary shadow-sm shadow-primary/20"
            : "border-white/12 bg-white/5 text-muted-foreground hover:border-white/25 hover:text-foreground",
        )}
      >
        {allLabel}
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.name)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
            value === category.name
              ? "pill-filter-active border-primary shadow-sm shadow-primary/20"
              : "border-white/12 bg-white/5 text-muted-foreground hover:border-white/25 hover:text-foreground",
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
