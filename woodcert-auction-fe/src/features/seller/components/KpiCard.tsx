/**
 * Card KPI nhỏ trên dashboard seller.
 *
 * Có trạng thái loading và nhận class màu từ bên ngoài để mỗi chỉ số có điểm
 * nhấn riêng nhưng vẫn cùng layout.
 */
import { cn } from "@/shared/lib/utils";

type KpiCardProps = {
  label: string;
  value: number;
  valueClass: string;
  accentClass: string;
  isLoading: boolean;
};

export function KpiCard({ label, value, valueClass, accentClass, isLoading }: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#4e4637]/20 bg-white p-6 shadow-sm">
        <div className="mb-3 h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-12 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-1 w-8 rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="group rounded-lg border border-[#4e4637]/20 bg-white p-6 shadow-sm transition-colors hover:border-brushed-brass">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-warm">
        {label}
      </p>
      <p className={cn("font-serif text-3xl font-bold", valueClass)}>{value}</p>
      <div
        className={cn(
          "mt-4 h-1 w-8 rounded-full bg-[#4e4637]/20 transition-all duration-300 group-hover:w-12",
          accentClass,
        )}
      />
    </div>
  );
}
