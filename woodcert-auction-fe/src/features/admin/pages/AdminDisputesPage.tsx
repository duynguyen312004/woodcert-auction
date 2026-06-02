import { useState } from "react";
import { Link } from "react-router";
import { RefreshCw, Scale } from "lucide-react";

import { useAdminDisputes, type DisputeStatus } from "@/features/dispute";
import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";

const TABS: Array<{ label: string; status?: DisputeStatus }> = [
  { label: "Tất cả" },
  { label: "Mới mở", status: "OPEN" },
  { label: "Đang xử lý", status: "UNDER_REVIEW" },
  { label: "Đã xử lý", status: "RESOLVED" },
  { label: "Đã hủy", status: "CANCELED" },
];

export function AdminDisputesPage() {
  const [status, setStatus] = useState<DisputeStatus | undefined>();
  const query = useAdminDisputes({ status, size: 20 });
  const disputes = query.data?.result ?? [];

  return (
    <main className="px-8 py-8">
      <header className="flex items-end justify-between border-b border-white/10 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
          <h1 className="mt-1 text-3xl font-bold">Tranh chấp</h1>
        </div>
        <Button type="button" variant="outline" onClick={() => void query.refetch()}>
          <RefreshCw className={query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Làm mới
        </Button>
      </header>

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setStatus(tab.status)}
            className={
              status === tab.status
                ? "rounded-full border border-primary bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                : "rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-bold text-[#d2c5b2]"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#f2eee5] text-stone-950">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-[#e9e2d6] text-xs uppercase text-stone-500">
            <tr>
              <th className="px-5 py-3">Vụ</th>
              <th className="px-5 py-3">Đơn</th>
              <th className="px-5 py-3">Lý do</th>
              <th className="px-5 py-3">Trạng thái</th>
              <th className="px-5 py-3">Mở lúc</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-300">
            {disputes.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 font-bold">#{item.id}</td>
                <td className="px-5 py-3">#{item.orderId}</td>
                <td className="px-5 py-3">{item.reason}</td>
                <td className="px-5 py-3">{item.status}</td>
                <td className="px-5 py-3">{formatDateTime(item.openedAt)}</td>
                <td className="px-5 py-3 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/disputes/${item.id}`}>
                      <Scale className="h-4 w-4" />
                      Xử lý
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {disputes.length === 0 && (
              <tr>
                <td className="px-5 py-12 text-center text-stone-500" colSpan={6}>
                  Không có tranh chấp phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
