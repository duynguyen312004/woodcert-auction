import { useQuery } from "@tanstack/react-query";

import { accountApi } from "../api/account";

export const PROFILE_QUERY_KEY = ["account", "profile"] as const;
export const SELLER_PROFILE_QUERY_KEY = ["account", "seller-profile"] as const;

/**
 * Lấy profile của người dùng đang đăng nhập.
 */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: accountApi.getProfile,
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

/**
 * Lấy hồ sơ seller của người dùng hiện tại.
 *
 * Nếu chưa đăng ký seller thì backend trả 404 và query sẽ ở trạng thái lỗi.
 */
export function useSellerProfile() {
  return useQuery({
    queryKey: SELLER_PROFILE_QUERY_KEY,
    queryFn: accountApi.getSellerProfile,
    retry: false,
  });
}
