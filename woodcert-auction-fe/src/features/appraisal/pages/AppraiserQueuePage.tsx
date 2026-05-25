/**
 * Màn hình hàng chờ kiểm định cho appraiser.
 *
 * Tab "Hàng chờ" hiển thị sản phẩm PENDING_APPRAISAL chưa có claim còn hạn.
 * Tab "Đang kiểm định" hiển thị sản phẩm UNDER_APPRAISAL của chính appraiser hiện tại.
 * Nút "Bắt đầu kiểm định" gọi claim API rồi điều hướng về trang chi tiết.
 */
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { isApiError } from "@/shared/api/errors";
import { formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";
import { APPRAISER_PATHS } from "@/shared/constants/routes";

import {
  useAppraisalQueue,
  useAppraisalMyActive,
  useClaimProduct,
} from "../hooks/useAppraisalQueue";
import type { AppraisalQueueItem } from "../types";

const PAGE_SIZE = 10;

type Tab = "queue" | "active";

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPRAISAL: "Chờ kiểm định",
  UNDER_APPRAISAL: "Đang kiểm định",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING_APPRAISAL: "bg-[#D6A84F]/10 text-[#D6A84F] border border-[#D6A84F]/20",
  UNDER_APPRAISAL: "bg-[#2E4A62]/10 text-[#2E4A62] border border-[#2E4A62]/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight",
        STATUS_CLASS[status] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i}>
          <td className="px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="size-12 shrink-0 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-5 w-24 animate-pulse rounded-full bg-gray-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </td>
          <td className="px-6 py-4 text-right">
            <div className="ml-auto h-8 w-32 animate-pulse rounded bg-gray-200" />
          </td>
        </tr>
      ))}
    </>
  );
}

function ProductRow({
  item,
  tab,
  onAction,
  actionLoading,
}: {
  item: AppraisalQueueItem;
  tab: Tab;
  onAction: (id: number) => void;
  actionLoading: boolean;
}) {
  const primaryImage = item.primaryImage;
  const isExpired =
    tab === "queue" &&
    item.status === "UNDER_APPRAISAL" &&
    (!item.appraisalClaimExpiresAt || new Date(item.appraisalClaimExpiresAt) <= new Date());
  const actionLabel =
    tab === "active"
      ? "Tiếp tục kiểm định"
      : isExpired
        ? "Nhận lại kiểm định"
        : "Bắt đầu kiểm định";

  return (
    <tr className="border-b border-[#4e4637]/10 hover:bg-[#f6f0e6]/60 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="size-12 shrink-0 overflow-hidden rounded bg-[#f0e8d8]">
            {primaryImage ? (
              <img src={primaryImage} alt={item.title} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-[#8D877C]">
                <ClipboardList className="size-5" aria-hidden />
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-ink-blue line-clamp-2">{item.title}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-[#4e4637]">{item.category?.name ?? "—"}</td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={item.status} />
          {isExpired && (
            <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-amber-700">
              Claim hết hạn
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-warm">
        {formatDate(item.submittedAt ?? item.createdAt)}
      </td>
      <td className="px-6 py-4 text-right">
        <Button
          size="sm"
          onClick={() => onAction(item.id)}
          disabled={actionLoading}
          className="gap-1.5"
        >
          {actionLoading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : tab === "queue" ? (
            <Play className="size-3.5" aria-hidden />
          ) : null}
          {actionLabel}
        </Button>
      </td>
    </tr>
  );
}

export function AppraiserQueuePage() {
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [page, setPage] = useState(1);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const notification = useNotification();
  const navigate = useNavigate();
  const claimMutation = useClaimProduct();

  const queueQuery = useAppraisalQueue({ page, size: PAGE_SIZE });
  const activeQuery = useAppraisalMyActive({ page, size: PAGE_SIZE });

  const currentQuery = activeTab === "queue" ? queueQuery : activeQuery;
  const items = currentQuery.data?.result ?? [];
  const meta = currentQuery.data?.meta;
  const totalPages = meta?.pages ?? 1;

  const queueCount = queueQuery.data?.meta.total ?? 0;
  const activeCount = activeQuery.data?.meta.total ?? 0;

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleAction = async (productId: number) => {
    if (activeTab === "active") {
      void navigate(APPRAISER_PATHS.productDetail(productId));
      return;
    }

    setClaimingId(productId);
    try {
      await claimMutation.mutateAsync(productId);
      notification.success("Đã nhận kiểm định", {
        description: "Sản phẩm đã được giao cho bạn. Bắt đầu kiểm định ngay.",
      });
      void navigate(APPRAISER_PATHS.productDetail(productId));
    } catch (err) {
      const msg =
        isApiError(err) && err.statusCode === 409
          ? "Sản phẩm đã được appraiser khác nhận. Vui lòng chọn sản phẩm khác."
          : "Không thể nhận sản phẩm. Vui lòng thử lại.";
      notification.error("Không thể nhận kiểm định", { description: msg });
    } finally {
      setClaimingId(null);
    }
  };

  const tabs = useMemo(
    () => [
      { id: "queue" as Tab, label: "Hàng chờ", count: queueCount },
      { id: "active" as Tab, label: "Đang kiểm định", count: activeCount },
    ],
    [queueCount, activeCount],
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-blue">Kiểm định sản phẩm</h1>
          <p className="mt-1 text-sm text-muted-warm">
            Chọn sản phẩm từ hàng chờ để bắt đầu quá trình kiểm định.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void currentQuery.refetch()}
          disabled={currentQuery.isFetching}
          className="gap-2"
        >
          <RefreshCw
            className={cn("size-4", currentQuery.isFetching && "animate-spin")}
            aria-hidden
          />
          Làm mới
        </Button>
      </div>

      <div className="mb-6 flex border-b border-[#4e4637]/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-brushed-brass text-ink-blue"
                : "border-transparent text-muted-warm hover:text-ink-blue",
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  activeTab === tab.id
                    ? "bg-brushed-brass/20 text-brushed-brass"
                    : "bg-gray-100 text-gray-500",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {currentQuery.isError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Không thể tải dữ liệu. Vui lòng thử lại.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#4e4637]/20 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#4e4637]/10 bg-[#f6f0e6]/60">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4e4637]">
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4e4637]">
                Danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4e4637]">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4e4637]">
                Ngày gửi
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#4e4637]">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {currentQuery.isPending ? (
              <TableSkeleton />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-muted-warm">
                  {activeTab === "queue"
                    ? "Hiện không có sản phẩm nào đang chờ kiểm định."
                    : "Bạn chưa nhận sản phẩm nào để kiểm định."}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ProductRow
                  key={item.id}
                  item={item}
                  tab={activeTab}
                  onAction={(id) => void handleAction(id)}
                  actionLoading={claimingId === item.id && claimMutation.isPending}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-warm">
          <span>
            Trang {page} / {totalPages} — Tổng {meta?.total ?? 0} sản phẩm
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="gap-1"
            >
              Sau
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
