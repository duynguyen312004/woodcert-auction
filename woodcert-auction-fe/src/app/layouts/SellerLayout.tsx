/**
 * Layout chính của khu seller.
 *
 * Chỉ dùng cho các route seller đã được bảo vệ. Sidebar đứng cố định, còn nội
 * dung từng trang seller sẽ hiển thị trong phần main có thể cuộn.
 */
import { Outlet } from "react-router";

import { SellerCapabilityBanner, SellerCapabilityProvider, SellerSidebar } from "@/features/seller";

export function SellerLayout() {
  return (
    <SellerCapabilityProvider>
      <div className="flex h-screen overflow-hidden">
        <SellerSidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-warm-ivory text-[#181612]">
          <SellerCapabilityBanner />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SellerCapabilityProvider>
  );
}
