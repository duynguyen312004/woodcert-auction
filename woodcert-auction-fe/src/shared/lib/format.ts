const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const VND_CURRENCY_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const VND_COMPACT_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1,
});

const PERCENT_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "percent",
  maximumFractionDigits: 2,
});

export function formatVND(value: number): string {
  return VND_FORMATTER.format(value) + " đ";
}

export function formatCurrencyVND(value: number): string {
  return VND_CURRENCY_FORMATTER.format(value);
}

export function formatCompactVND(value: number): string {
  if (value === 0) return "VND 0";
  return VND_COMPACT_FORMATTER.format(value);
}

export function formatPercent(value: number): string {
  return PERCENT_FORMATTER.format(value);
}
