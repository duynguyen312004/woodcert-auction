import type { ReactNode } from "react";
import { Gavel, Layers, SlidersHorizontal, TreePine, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { AuctionFilters } from "../types";

type AuctionFilterBarProps = {
  filters: AuctionFilters;
  onChange: (filters: AuctionFilters) => void;
  availableCategories: string[];
  availableWoodTypes: string[];
  isLoading?: boolean;
};

type FilterRowProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
};

function FilterRow({ icon, label, children }: FilterRowProps) {
  return (
    <div className="flex min-h-10 items-start gap-4 py-1">
      <div className="flex w-28 shrink-0 items-center gap-2 pt-1.5">
        <span className="text-primary/70">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

type PillGroupProps = {
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  isLoading?: boolean;
  emptyLabel?: string;
};

function PillGroup({ options, value, onChange, isLoading, emptyLabel = "Tất cả" }: PillGroupProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-16 animate-pulse rounded-full bg-muted"
            style={{ animationDelay: `${i * 0.06}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={cn(
          "h-7 rounded-full border px-3.5 text-xs font-medium whitespace-nowrap transition-all duration-200",
          value === undefined
            ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
            : "border-white/12 bg-white/4 text-muted-foreground hover:border-white/22 hover:text-foreground",
        )}
      >
        {emptyLabel}
      </button>

      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? undefined : opt.value)}
          className={cn(
            "h-7 rounded-full border px-3.5 text-xs font-medium whitespace-nowrap transition-all duration-200",
            value === opt.value
              ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "border-white/12 bg-white/4 text-muted-foreground hover:border-white/22 hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ACTIVE", label: "Đang đấu giá" },
  { value: "WAITING", label: "Chuẩn bị mở" },
];

export function AuctionFilterBar({
  filters,
  onChange,
  availableCategories,
  availableWoodTypes,
  isLoading,
}: AuctionFilterBarProps) {
  const { status, categoryName, woodType } = filters;

  const activeCount = [status, categoryName, woodType].filter(Boolean).length;
  const hasActiveFilters = activeCount > 0;

  const categoryOptions = availableCategories.map((c) => ({ value: c, label: c }));
  const woodTypeOptions = availableWoodTypes.map((w) => ({ value: w, label: w }));

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-card/35 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          Bộ lọc
          {hasActiveFilters && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/12 hover:text-destructive"
          >
            <X className="h-3 w-3" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="divide-y divide-white/5 px-5">
        <div className="py-3.5">
          <FilterRow icon={<Gavel className="h-3.5 w-3.5" />} label="Trạng thái">
            <PillGroup
              options={STATUS_OPTIONS}
              value={status}
              onChange={(val) =>
                onChange({ ...filters, status: val as "ACTIVE" | "WAITING" | undefined })
              }
            />
          </FilterRow>
        </div>

        <div className="py-3.5">
          <FilterRow icon={<Layers className="h-3.5 w-3.5" />} label="Danh mục">
            <PillGroup
              options={categoryOptions}
              value={categoryName}
              onChange={(val) => onChange({ ...filters, categoryName: val })}
              isLoading={isLoading && categoryOptions.length === 0}
            />
          </FilterRow>
        </div>

        <div className="py-3.5">
          <FilterRow icon={<TreePine className="h-3.5 w-3.5" />} label="Loại gỗ">
            <PillGroup
              options={woodTypeOptions}
              value={woodType}
              onChange={(val) => onChange({ ...filters, woodType: val })}
              isLoading={isLoading && woodTypeOptions.length === 0}
              emptyLabel="Tất cả"
            />
          </FilterRow>
        </div>
      </div>
    </div>
  );
}
