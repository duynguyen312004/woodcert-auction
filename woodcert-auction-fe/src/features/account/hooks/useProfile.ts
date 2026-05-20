import { useQuery } from "@tanstack/react-query";

import { accountApi } from "../api/account";

export const PROFILE_QUERY_KEY = ["account", "profile"] as const;
export const SELLER_PROFILE_QUERY_KEY = ["account", "seller-profile"] as const;

/**
 * useProfile — Lấy thông tin profile người dùng đang đăng nhập.
 * Query key: ["account", "profile"]
 */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: accountApi.getProfile,
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

/**
 * useSellerProfile — Lấy hồ sơ người bán.
 * Trả về undefined nếu người dùng chưa đăng ký làm người bán (404 → isError).
 * Query key: ["account", "seller-profile"]
 */
export function useSellerProfile() {
  return useQuery({
    queryKey: SELLER_PROFILE_QUERY_KEY,
    queryFn: accountApi.getSellerProfile,
    retry: false,
  });
}
