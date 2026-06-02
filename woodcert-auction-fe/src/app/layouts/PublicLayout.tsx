import { Outlet } from "react-router";

import { useScrollToTop } from "@/shared/hooks";

import { Footer } from "./components/Footer";
import { Header } from "./components/Header";

export function PublicLayout() {
  useScrollToTop();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <Header />
      {/* pt-[4.25rem] accounts for fixed header height (68px) */}
      <main className="flex-1 w-full pt-[4.25rem]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
