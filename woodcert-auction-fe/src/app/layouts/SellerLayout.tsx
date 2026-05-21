/**
 * Layout chính của khu seller.
 *
 * Chỉ dùng cho các route seller đã được bảo vệ. Sidebar đứng cố định, còn nội
 * dung từng trang seller sẽ hiển thị trong phần main có thể cuộn.
 */
import { Outlet } from "react-router";

import { SellerSidebar } from "@/features/seller/components/SellerSidebar";

export function SellerLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <SellerSidebar />
      <main className="flex-1 overflow-y-auto bg-warm-ivory text-[#181612]">
        <Outlet />
      </main>
    </div>
  );
}
