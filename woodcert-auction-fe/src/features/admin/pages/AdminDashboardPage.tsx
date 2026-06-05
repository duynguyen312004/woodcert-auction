import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ArrowRight, Banknote, Boxes, RefreshCw, Scale, Users } from "lucide-react";

import { disputeApi } from "@/features/dispute";
import { formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { revenueApi } from "../api/revenue";
import { adminUserApi } from "../api/users";

const SHORTCUTS = [
  { label: "Doanh thu sàn", to: "/admin/revenue", icon: Banknote },
  { label: "Tranh chấp", to: "/admin/disputes", icon: Scale },
  { label: "Danh mục", to: "/admin/categories", icon: Boxes },
  { label: "Người dùng", to: "/admin/users", icon: Users },
];

export function AdminDashboardPage() {
  const usersQuery = useQuery({
    queryKey: ["admin", "dashboard", "users-total"],
    queryFn: () => adminUserApi.getUsers({ size: 1 }),
  });
  const openDisputesQuery = useQuery({
    queryKey: ["admin", "dashboard", "open-disputes"],
    queryFn: () => disputeApi.getAdminDisputes({ status: "OPEN", size: 1 }),
  });
  const revenueQuery = useQuery({
    queryKey: ["admin", "dashboard", "revenue"],
    queryFn: () => revenueApi.getStats(),
  });

  const isFetching =
    usersQuery.isFetching || openDisputesQuery.isFetching || revenueQuery.isFetching;

  const refreshAll = () => {
    void usersQuery.refetch();
    void openDisputesQuery.refetch();
    void revenueQuery.refetch();
  };

  const stats = [
    {
      label: "Tổng người dùng",
      value: usersQuery.data?.meta.total ?? 0,
      icon: Users,
      iconClass: "text-sky-400",
      to: "/admin/users",
    },
    {
      label: "Tranh chấp đang mở",
      value: openDisputesQuery.data?.meta.total ?? 0,
      icon: Scale,
      iconClass: "text-amber-400",
      to: "/admin/disputes",
    },
    {
      label: "Tổng doanh thu",
      value: formatVND(revenueQuery.data?.totalAmount ?? 0),
      icon: Banknote,
      iconClass: "text-emerald-400",
      to: "/admin/revenue",
    },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Tổng quan</h1>
          </div>
          <Button type="button" variant="outline" onClick={refreshAll}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Làm mới
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              to={stat.to}
              className="group rounded-lg border border-white/10 bg-card p-5 text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/20"
            >
              <div className="flex items-center justify-between">
                <stat.icon className={cn("h-6 w-6", stat.iconClass)} />
                <ArrowRight className="h-4 w-4 text-[#a49a88] transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase text-[#a49a88]">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[#f2eee5]">{stat.value}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-lg border border-white/10 bg-card p-5 text-foreground">
          <h2 className="font-bold text-[#f2eee5]">Truy cập nhanh</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SHORTCUTS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[#d2c5b2] transition-colors hover:border-primary/30 hover:bg-white/10 hover:text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                <ArrowRight className="ml-auto h-4 w-4 opacity-60" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
