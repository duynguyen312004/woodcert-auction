import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Ban, CheckCircle2, CircleDot, RefreshCw, Scale, SearchCheck, XCircle } from "lucide-react";

import { useAdminDisputes, type DisputeStatus } from "@/features/dispute";
import { formatDateTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Pagination } from "@/shared/ui/pagination";

import { AdminEmptyState } from "../components/AdminEmptyState";
import { DISPUTE_STATUS_LABEL } from "../lib/dispute-labels";

const TABS: Array<{ label: string; status?: DisputeStatus }> = [
  { label: "Tất cả" },
  { label: DISPUTE_STATUS_LABEL.OPEN, status: "OPEN" },
  { label: DISPUTE_STATUS_LABEL.UNDER_REVIEW, status: "UNDER_REVIEW" },
  { label: DISPUTE_STATUS_LABEL.RESOLVED, status: "RESOLVED" },
  { label: DISPUTE_STATUS_LABEL.REJECTED, status: "REJECTED" },
  { label: DISPUTE_STATUS_LABEL.CANCELED, status: "CANCELED" },
];

const STATUS_CARD: Record<
  DisputeStatus,
  {
    icon: typeof CircleDot;
    className: string;
    iconClassName: string;
  }
> = {
  OPEN: {
    icon: CircleDot,
    className: "border-amber-500/20 bg-amber-500/5 text-amber-200 hover:bg-amber-500/10",
    iconClassName: "bg-amber-500/10 text-amber-400",
  },
  UNDER_REVIEW: {
    icon: SearchCheck,
    className: "border-sky-500/20 bg-sky-500/5 text-sky-200 hover:bg-sky-500/10",
    iconClassName: "bg-sky-500/10 text-sky-400",
  },
  RESOLVED: {
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/5 text-emerald-200 hover:bg-emerald-500/10",
    iconClassName: "bg-emerald-500/10 text-emerald-400",
  },
  REJECTED: {
    icon: XCircle,
    className: "border-red-500/20 bg-red-500/5 text-red-200 hover:bg-red-500/10",
    iconClassName: "bg-red-500/10 text-red-400",
  },
  CANCELED: {
    icon: Ban,
    className: "border-white/5 bg-white/3 text-[#a49a88] hover:bg-white/5",
    iconClassName: "bg-white/5 text-[#a49a88]",
  },
};

export function AdminDisputesPage() {
  const [status, setStatus] = useState<DisputeStatus | undefined>();
  const [page, setPage] = useState(1);
  const query = useAdminDisputes({ status, page, size: 20 });
  const disputes = useMemo(() => query.data?.result ?? [], [query.data?.result]);
  const meta = query.data?.meta;

  const changeStatus = (next: DisputeStatus | undefined) => {
    setStatus(next);
    setPage(1);
  };

  const statusSummary = useMemo(() => {
    return disputes.reduce(
      (summary, item) => {
        summary[item.status] = (summary[item.status] ?? 0) + 1;
        return summary;
      },
      {} as Partial<Record<DisputeStatus, number>>,
    );
  }, [disputes]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Quản trị</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Tranh chấp</h1>
          </div>
          <Button type="button" variant="outline" onClick={() => void query.refetch()}>
            <RefreshCw className={query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Làm mới
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {(Object.keys(DISPUTE_STATUS_LABEL) as DisputeStatus[]).map((itemStatus) => {
            const config = STATUS_CARD[itemStatus];
            const Icon = config.icon;
            return (
              <button
                key={itemStatus}
                type="button"
                onClick={() => changeStatus(itemStatus)}
                className={cn(
                  "min-h-[118px] rounded-lg border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  config.className,
                  status === itemStatus && "ring-2 ring-primary/60",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold uppercase tracking-wide">
                    {DISPUTE_STATUS_LABEL[itemStatus]}
                  </span>
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-md",
                      config.iconClassName,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold tabular-nums">
                  {statusSummary[itemStatus] ?? 0}
                </p>
              </button>
            );
          })}
        </section>

        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => changeStatus(tab.status)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                status === tab.status
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/12 bg-white/5 text-[#d2c5b2] hover:bg-white/10 hover:text-primary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-card text-foreground">
          {disputes.length === 0 ? (
            <AdminEmptyState
              icon={Scale}
              title="Không có tranh chấp phù hợp"
              description="Bộ lọc hiện tại chưa có vụ việc cần xử lý. Bạn có thể đổi trạng thái hoặc làm mới để kiểm tra dữ liệu mới."
              action={
                <Button type="button" variant="outline" onClick={() => changeStatus(undefined)}>
                  Xem tất cả
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase text-[#a49a88]">
                  <tr>
                    <th className="px-5 py-3">Vụ</th>
                    <th className="px-5 py-3">Đơn</th>
                    <th className="px-5 py-3">Lý do</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Mở lúc</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {disputes.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-white/5">
                      <td className="px-5 py-3 font-bold text-[#f2eee5]">#{item.id}</td>
                      <td className="px-5 py-3 text-[#d2c5b2]">#{item.orderId}</td>
                      <td className="px-5 py-3 text-[#d2c5b2]">{item.reason}</td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold border",
                            item.status === "OPEN" &&
                              "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            item.status === "UNDER_REVIEW" &&
                              "bg-sky-500/10 text-sky-400 border-sky-500/20",
                            item.status === "RESOLVED" &&
                              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            item.status === "REJECTED" &&
                              "bg-red-500/10 text-red-400 border-red-500/20",
                            item.status === "CANCELED" &&
                              "bg-white/5 text-[#a49a88] border-white/10",
                          )}
                        >
                          {DISPUTE_STATUS_LABEL[item.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#a49a88]">{formatDateTime(item.openedAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-white/10 hover:bg-white/5"
                        >
                          <Link to={`/admin/disputes/${item.id}`}>
                            <Scale className="h-4 w-4" />
                            Xử lý
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-white/10 px-5 py-4">
                <Pagination page={meta?.page ?? page} pages={meta?.pages ?? 1} onPage={setPage} />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
