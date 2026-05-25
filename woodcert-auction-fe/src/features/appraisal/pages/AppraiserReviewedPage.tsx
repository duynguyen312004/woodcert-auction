/**
 * Màn hình sản phẩm đã xử lý của appraiser.
 *
 * Tab "Đã duyệt" (APPRAISED) và "Đã từ chối" (REJECTED).
 * Mỗi dòng có link xem chi tiết ở chế độ read-only.
 */
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { APPRAISER_PATHS } from "@/shared/constants/routes";

import { useAppraisalReviewed } from "../hooks/useAppraisalQueue";
import type { AppraisalQueueItem } from "../types";

const PAGE_SIZE = 10;

type ReviewTab = "APPRAISED" | "REJECTED";

const REVIEW_TAB_CONFIG = [
  { id: "APPRAISED" as ReviewTab, label: "Đã duyệt" },
  { id: "REJECTED" as ReviewTab, label: "Đã từ chối" },
];

const STATUS_LABEL: Record<ReviewTab, string> = {
  APPRAISED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

const STATUS_CLASS: Record<ReviewTab, string> = {
  APPRAISED: "bg-[#2F7D68]/10 text-[#2F7D68] border border-[#2F7D68]/20",
  REJECTED: "bg-red-500/10 text-red-600 border border-red-500/20",
};

function StatusBadge({ status }: { status: ReviewTab }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight",
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
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
            <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </td>
          <td className="px-6 py-4 text-right">
            <div className="ml-auto h-5 w-5 animate-pulse rounded bg-gray-200" />
          </td>
        </tr>
      ))}
    </>
  );
}

function ReviewedRow({
  item,
  reviewStatus,
}: {
  item: AppraisalQueueItem;
  reviewStatus: ReviewTab;
}) {
  const primaryImage = item.primaryImage;

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
        <StatusBadge status={reviewStatus} />
      </td>
      <td className="px-6 py-4 text-sm text-muted-warm">
        {formatDate(item.submittedAt ?? item.createdAt)}
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          to={APPRAISER_PATHS.productDetail(item.id)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brushed-brass hover:underline"
        >
          Xem chi tiết
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </td>
    </tr>
  );
}

export function AppraiserReviewedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const activeTab: ReviewTab = statusParam === "REJECTED" ? "REJECTED" : "APPRAISED";
  const [page, setPage] = useState(1);

  const reviewedQuery = useAppraisalReviewed({ page, size: PAGE_SIZE, reviewStatus: activeTab });

  const items = reviewedQuery.data?.result ?? [];
  const meta = reviewedQuery.data?.meta;
  const totalPages = meta?.pages ?? 1;

  const handleTabChange = (tab: ReviewTab) => {
    setSearchParams({ status: tab });
    setPage(1);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-blue">Sản phẩm đã xử lý</h1>
          <p className="mt-1 text-sm text-muted-warm">
            Danh sách sản phẩm bạn đã thẩm định và kết quả kiểm định.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void reviewedQuery.refetch()}
          disabled={reviewedQuery.isFetching}
          className="gap-2"
        >
          <RefreshCw
            className={cn("size-4", reviewedQuery.isFetching && "animate-spin")}
            aria-hidden
          />
          Làm mới
        </Button>
      </div>

      <div className="mb-6 flex border-b border-[#4e4637]/20">
        {REVIEW_TAB_CONFIG.map((tab) => (
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
          </button>
        ))}
      </div>

      {reviewedQuery.isError && (
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
                Kết quả
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4e4637]">
                Ngày gửi
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#4e4637]">
                Chi tiết
              </th>
            </tr>
          </thead>
          <tbody>
            {reviewedQuery.isPending ? (
              <TableSkeleton />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-sm text-muted-warm">
                  {activeTab === "APPRAISED"
                    ? "Bạn chưa duyệt sản phẩm nào."
                    : "Bạn chưa từ chối sản phẩm nào."}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ReviewedRow key={item.id} item={item} reviewStatus={activeTab} />
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
