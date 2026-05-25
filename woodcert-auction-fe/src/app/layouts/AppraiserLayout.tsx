/**
 * Layout chính của khu appraiser.
 *
 * Dùng cho các route appraiser đã được bảo vệ. Sidebar cố định, nội dung cuộn.
 */
import { Outlet } from "react-router";

import { AppraiserSidebar } from "@/features/appraisal/components/AppraiserSidebar";

export function AppraiserLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppraiserSidebar />
      <main className="flex-1 overflow-y-auto bg-warm-ivory text-[#181612]">
        <Outlet />
      </main>
    </div>
  );
}
