import { Banknote, Boxes, Scale, ShieldCheck } from "lucide-react";
import { NavLink, Outlet } from "react-router";

import { cn } from "@/shared/lib/utils";

const NAV = [
  { label: "Doanh thu", to: "/admin/revenue", icon: Banknote },
  { label: "Tranh chấp", to: "/admin/disputes", icon: Scale },
  { label: "Danh mục", to: "/admin/categories", icon: Boxes },
  { label: "Appraiser", to: "/admin/appraisers", icon: ShieldCheck },
];

export function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#181612] text-[#f2eee5]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#11100d] p-5">
        <div className="border-b border-white/10 pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">WoodCert</p>
          <h1 className="mt-1 text-lg font-bold">Admin Operations</h1>
        </div>
        <nav className="mt-6 grid gap-1">
          {NAV.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-[#d2c5b2] hover:bg-white/6 hover:text-primary",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
