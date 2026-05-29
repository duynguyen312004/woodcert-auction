/**
 * Các hàm định dạng dùng chung ở giao diện.
 *
 * Các màn đấu giá, catalog, seller và tài khoản dùng file này để hiển thị số
 * tiền, phần trăm và ngày tháng theo kiểu Việt Nam. Tạo sẵn bộ định dạng ở đây để
 * component không phải tự tạo lại nhiều lần.
 */
const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

// Dùng khi muốn hiển thị tiền theo chuẩn tiền tệ của trình duyệt.
const VND_CURRENCY_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

// Dùng cho card, bảng và dashboard khi cần số tiền gọn hơn.
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

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Định dạng số tiền VND dạng đơn giản, ví dụ: 1.000.000 VNĐ.
 */
export function formatVND(value: number): string {
  return VND_FORMATTER.format(value) + " VNĐ";
}

export function formatCurrencyVND(value: number): string {
  return VND_CURRENCY_FORMATTER.format(value).replace(/₫/g, "VNĐ").replace(/đ/g, "VNĐ");
}

export function formatCompactVND(value: number): string {
  if (value === 0) return "0 VNĐ";
  return VND_COMPACT_FORMATTER.format(value).replace(/₫/g, "VNĐ").replace(/đ/g, "VNĐ");
}

export function formatPercent(value: number): string {
  return PERCENT_FORMATTER.format(value);
}

export function formatDate(value: string | undefined): string {
  if (!value) return "\u2014";
  return DATE_FORMATTER.format(new Date(value));
}

export function formatDateTime(value: string | undefined): string {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return DATE_TIME_FORMATTER.format(date);
}
