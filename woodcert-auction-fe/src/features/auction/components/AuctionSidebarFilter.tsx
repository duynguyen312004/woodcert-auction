import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type SidebarFilters = {
  selectedCategories: string[];
  selectedWoodTypes: string[];
  priceMin: string;
  priceMax: string;
  appliedPriceMin?: number;
  appliedPriceMax?: number;
};

export const defaultSidebarFilters: SidebarFilters = {
  selectedCategories: [],
  selectedWoodTypes: [],
  priceMin: "",
  priceMax: "",
  appliedPriceMin: undefined,
  appliedPriceMax: undefined,
};

type AuctionSidebarFilterProps = {
  availableCategories: string[];
  availableWoodTypes: string[];
  isCategoriesLoading?: boolean;
  isWoodTypesLoading?: boolean;
  filters: SidebarFilters;
  onChange: (filters: SidebarFilters) => void;
};

type CheckboxSectionProps = {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  isLoading?: boolean;
  emptyText?: string;
};

function CheckboxSection({
  title,
  options,
  selected,
  onToggle,
  isLoading,
  emptyText = "Không có dữ liệu",
}: CheckboxSectionProps) {
  return (
    <div>
      <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white">{title}</h3>
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-5 w-28 animate-pulse rounded bg-white/10" />
          ))
        ) : options.length === 0 ? (
          <p className="text-xs text-[#8D877C]">{emptyText}</p>
        ) : (
          options.map((option) => (
            <label key={option} className="group flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => onToggle(option)}
                className="h-4 w-4 rounded border-[#4e4637] bg-transparent accent-[#D6A84F] focus:ring-[#D6A84F]"
              />
              <span
                className={cn(
                  "text-sm transition-colors",
                  selected.includes(option)
                    ? "text-[#D6A84F]"
                    : "text-[#d2c5b2] group-hover:text-white",
                )}
              >
                {option}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export function AuctionSidebarFilter({
  availableCategories,
  availableWoodTypes,
  isCategoriesLoading = false,
  isWoodTypesLoading = false,
  filters,
  onChange,
}: AuctionSidebarFilterProps) {
  const { selectedCategories, selectedWoodTypes, priceMin, priceMax } = filters;

  const hasPriceFilter =
    filters.appliedPriceMin !== undefined || filters.appliedPriceMax !== undefined;
  const activeCount =
    selectedCategories.length + selectedWoodTypes.length + (hasPriceFilter ? 1 : 0);

  const toggleCategory = (value: string) => {
    const next = selectedCategories.includes(value)
      ? selectedCategories.filter((c) => c !== value)
      : [...selectedCategories, value];
    onChange({ ...filters, selectedCategories: next });
  };

  const toggleWoodType = (value: string) => {
    const next = selectedWoodTypes.includes(value)
      ? selectedWoodTypes.filter((w) => w !== value)
      : [...selectedWoodTypes, value];
    onChange({ ...filters, selectedWoodTypes: next });
  };

  const handleReset = () => onChange(defaultSidebarFilters);

  const handleApplyPrice = () => {
    const min = priceMin ? parseFloat(priceMin.replace(/\D/g, "")) : undefined;
    const max = priceMax ? parseFloat(priceMax.replace(/\D/g, "")) : undefined;
    onChange({
      ...filters,
      appliedPriceMin: min && !Number.isNaN(min) ? min : undefined,
      appliedPriceMax: max && !Number.isNaN(max) ? max : undefined,
    });
  };

  return (
    <aside className="sticky top-[88px] flex h-fit w-64 shrink-0 flex-col gap-7 rounded-lg border border-[#4e4637] bg-[#171717] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-white">Bộ lọc</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#D6A84F] transition-opacity hover:opacity-70"
          >
            <X className="h-3 w-3" />
            Xóa ({activeCount})
          </button>
        )}
      </div>

      <CheckboxSection
        title="Loại tác phẩm"
        options={availableCategories}
        selected={selectedCategories}
        onToggle={toggleCategory}
        isLoading={isCategoriesLoading}
        emptyText="Chưa có danh mục"
      />

      <CheckboxSection
        title="Chất liệu"
        options={availableWoodTypes}
        selected={selectedWoodTypes}
        onToggle={toggleWoodType}
        isLoading={isWoodTypesLoading}
        emptyText="Chưa có dữ liệu chất liệu"
      />

      <div>
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white">
          Khoảng giá (VNĐ)
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Từ"
            value={priceMin}
            onChange={(e) =>
              onChange({ ...filters, priceMin: e.target.value, appliedPriceMin: undefined })
            }
            onKeyDown={(e) => e.key === "Enter" && handleApplyPrice()}
            className="w-1/2 rounded border-none bg-[#39342d] p-2 text-xs text-white placeholder:text-[#8D877C] focus:outline-none focus:ring-1 focus:ring-[#D6A84F]/50"
          />
          <input
            type="text"
            placeholder="Đến"
            value={priceMax}
            onChange={(e) =>
              onChange({ ...filters, priceMax: e.target.value, appliedPriceMax: undefined })
            }
            onKeyDown={(e) => e.key === "Enter" && handleApplyPrice()}
            className="w-1/2 rounded border-none bg-[#39342d] p-2 text-xs text-white placeholder:text-[#8D877C] focus:outline-none focus:ring-1 focus:ring-[#D6A84F]/50"
          />
        </div>
        {(filters.appliedPriceMin !== undefined || filters.appliedPriceMax !== undefined) && (
          <p className="mt-2 text-[10px] text-[#D6A84F]">✓ Đang lọc theo khoảng giá</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleApplyPrice}
        className="mt-1 w-full rounded border border-[#D6A84F] py-3 text-xs font-bold uppercase tracking-widest text-[#D6A84F] transition-colors hover:bg-[#D6A84F]/10"
      >
        Áp dụng lọc giá
      </button>
    </aside>
  );
}
