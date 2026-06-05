/**
 * File gom export hook dùng chung.
 *
 * Giúp các feature import hook gọn hơn, ví dụ countdown dùng ở card đấu giá và
 * dashboard seller.
 */
export { formatTimeRemaining, useCountdown } from "./useCountdown";
export { useServerNow } from "./useServerNow";
export { useScrollToTop } from "./useScrollToTop";
