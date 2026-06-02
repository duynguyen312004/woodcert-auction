import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Hook tự động cuộn trang lên đầu (scroll to top) khi thay đổi route (pathname).
 * Giải quyết vấn đề giữ nguyên vị trí scroll của trang cũ khi chuyển sang trang mới.
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
}
