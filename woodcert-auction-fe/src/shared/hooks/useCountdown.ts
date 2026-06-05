/**
 * Hook và hàm định dạng thời gian đếm ngược.
 *
 * Card đấu giá và widget seller dùng file này để hiển thị thời gian còn lại.
 * Nếu cần tự truyền thời điểm hiện tại thì dùng formatTimeRemaining, còn muốn
 * tự cập nhật mỗi giây thì dùng useCountdown.
 */
import { useServerNow } from "./useServerNow";

type CountdownOptions = {
  emptyLabel?: string;
  endedLabel?: string;
  invalidLabel?: string;
  separator?: string;
  showDays?: boolean;
};

const DEFAULT_OPTIONS: Required<CountdownOptions> = {
  emptyLabel: "—",
  endedLabel: "Đã kết thúc",
  invalidLabel: "--:--:--",
  separator: ":",
  showDays: false,
};

/**
 * Đổi thời gian ISO sang chuỗi hiển thị như HH:mm:ss hoặc "N ngày HH:mm".
 */
export function formatTimeRemaining(
  targetTime: string | null | undefined,
  now: number,
  options: CountdownOptions = {},
) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!targetTime) return config.emptyLabel;

  const targetTimestamp = new Date(targetTime).getTime();
  if (Number.isNaN(targetTimestamp)) return config.invalidLabel;

  const remainingMs = Math.max(0, targetTimestamp - now);
  if (remainingMs === 0) return config.endedLabel;

  const totalSeconds = Math.floor(remainingMs / 1000);
  // Tách ngày/giờ/phút/giây rõ ràng để dễ đọc hơn các con số tự do.
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (config.showDays && days > 0) {
    return `${days} ngày ${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  const displayedHours = config.showDays ? hours : Math.floor(totalSeconds / 3_600);
  return [displayedHours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(config.separator);
}

/**
 * Bọc formatTimeRemaining thành hook tự cập nhật mỗi giây.
 */
export function useCountdown(targetTime: string | null | undefined, options?: CountdownOptions) {
  const now = useServerNow(targetTime ? 1000 : 60_000);
  return formatTimeRemaining(targetTime, now, options);
}
