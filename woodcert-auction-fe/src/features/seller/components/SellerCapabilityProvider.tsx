/**
 * Cung cấp trạng thái đình chỉ quyền bán cho toàn bộ seller portal.
 */
import { createContext, useContext, type ReactNode } from "react";

import { useProfile } from "@/features/account";

type SellerCapabilityContextValue = {
  isSuspended: boolean;
  reason: string | null;
  updatedAt: string | null;
};

const ACTIVE_SELLER_CAPABILITY: SellerCapabilityContextValue = {
  isSuspended: false,
  reason: null,
  updatedAt: null,
};

const SellerCapabilityContext =
  createContext<SellerCapabilityContextValue>(ACTIVE_SELLER_CAPABILITY);

export function SellerCapabilityProvider({ children }: { children: ReactNode }) {
  // Poll nhẹ để phiên seller đang mở nhận trạng thái đình chỉ mà không cần đăng nhập lại.
  const { data: profile } = useProfile({ refetchInterval: 30_000 });
  const sellerCapability = profile?.capabilityStatuses?.find(
    (item) => item.capability === "SELLER",
  );

  const value: SellerCapabilityContextValue =
    sellerCapability?.status === "BANNED"
      ? {
          isSuspended: true,
          reason: sellerCapability.reason,
          updatedAt: sellerCapability.updatedAt,
        }
      : ACTIVE_SELLER_CAPABILITY;

  return (
    <SellerCapabilityContext.Provider value={value}>{children}</SellerCapabilityContext.Provider>
  );
}

export function useSellerCapability() {
  return useContext(SellerCapabilityContext);
}
