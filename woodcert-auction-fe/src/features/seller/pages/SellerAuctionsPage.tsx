/**
 * Màn quản lý phiên đấu giá của seller.
 *
 * Trang dùng /auctions/me để seller theo dõi phiên đã tạo và hủy phiên còn WAITING.
 */
import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gavel,
  Loader2,
  PackageSearch,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { isApiError } from "@/shared/api/errors";
import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useNotification } from "@/shared/ui/notification";

import {
  SELLER_AUCTION_STATUS_CLASS,
  SELLER_AUCTION_STATUS_LABEL,
} from "../constants/auctionStatus";
import { useSellerCapability } from "../components/SellerCapabilityProvider";
import { SELLER_PATHS } from "../constants/routes";
import { useCancelAuction } from "../hooks/useProductMutations";
import { useSellerAuctions, useSellerAuctionStats } from "../hooks/useSellerDashboard";
import type { SellerAuction, SellerAuctionStatus } from "../types";

const PAGE_SIZE = 10;

type AuctionFilter = {
  id: string;
  label: string;
  status?: SellerAuctionStatus;
};

const ALL_AUCTIONS_FILTER: AuctionFilter = { id: "ALL", label: "Tất cả" };

const STATUS_FILTERS: AuctionFilter[] = [
  ALL_AUCTIONS_FILTER,
  { id: "WAITING", label: SELLER_AUCTION_STATUS_LABEL.WAITING, status: "WAITING" },
  { id: "ACTIVE", label: SELLER_AUCTION_STATUS_LABEL.ACTIVE, status: "ACTIVE" },
  {
    id: "ENDED_SUCCESS",
    label: SELLER_AUCTION_STATUS_LABEL.ENDED_SUCCESS,
    status: "ENDED_SUCCESS",
  },
  {
    id: "ENDED_FAILED",
    label: SELLER_AUCTION_STATUS_LABEL.ENDED_FAILED,
    status: "ENDED_FAILED",
  },
  { id: "CANCELED", label: SELLER_AUCTION_STATUS_LABEL.CANCELED, status: "CANCELED" },
];

export function SellerAuctionsPage() {
  const { isSuspended } = useSellerCapability();
  const [activeFilter, setActiveFilter] = useState<AuctionFilter>(ALL_AUCTIONS_FILTER);
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<SellerAuction | null>(null);
  const notification = useNotification();
  const cancelMutation = useCancelAuction();

  const listParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      ...(activeFilter.status ? { status: activeFilter.status } : {}),
    }),
    [activeFilter, page],
  );
  const auctionsQuery = useSellerAuctions(listParams);
  // useSellerAuctionStats gọi endpoint chuyên biệt GROUP BY — chính xác với mọi số lượng phiên.
  const statsQuery = useSellerAuctionStats();
  const stats = statsQuery.data;

  const auctions = auctionsQuery.data?.result ?? [];
  const meta = auctionsQuery.data?.meta;
  const totalPages = meta?.pages ?? 1;

  const handleFilterChange = (filter: AuctionFilter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget || isSuspended) return;

    try {
      await cancelMutation.mutateAsync(Number(cancelTarget.id));
      notification.success("Đã hủy phiên đấu giá", {
        description: cancelTarget.title,
      });
      setCancelTarget(null);
    } catch (error: unknown) {
      notification.error("Không thể hủy phiên", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại sau.",
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex min-h-[68px] shrink-0 items-center justify-between gap-4 border-b border-[#4e4637]/20 bg-warm-ivory/85 px-8 py-3 backdrop-blur-md">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brushed-brass">
            Seller Portal
          </p>
          <h1 className="font-serif text-xl font-bold text-ink-blue">Phiên đấu giá</h1>
        </div>

        {isSuspended ? (
          <Button disabled title="Quyền bán đang bị đình chỉ">
            <Plus className="size-4" aria-hidden />
            Tạo phiên
          </Button>
        ) : (
          <Button asChild className="bg-brushed-brass text-[#181612] hover:bg-brushed-brass/90">
            <Link to={SELLER_PATHS.newAuction}>
              <Plus className="size-4" aria-hidden />
              Tạo phiên
            </Link>
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] space-y-6 p-8">
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-5" aria-label="Thống kê phiên">
            <StatCard
              label={SELLER_AUCTION_STATUS_LABEL.WAITING}
              value={stats?.waiting ?? 0}
              tone="brass"
            />
            <StatCard
              label={SELLER_AUCTION_STATUS_LABEL.ACTIVE}
              value={stats?.active ?? 0}
              tone="red"
            />
            <StatCard
              label={SELLER_AUCTION_STATUS_LABEL.ENDED_SUCCESS}
              value={stats?.endedSuccess ?? 0}
              tone="green"
            />
            <StatCard
              label={SELLER_AUCTION_STATUS_LABEL.ENDED_FAILED}
              value={stats?.endedFailed ?? 0}
              tone="muted"
            />
            <StatCard
              label={SELLER_AUCTION_STATUS_LABEL.CANCELED}
              value={stats?.canceled ?? 0}
              tone="ink"
            />
          </section>

          <section className="overflow-hidden rounded-lg border border-[#4e4637]/15 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#4e4637]/10 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-ink-blue">Danh sách phiên</h2>
                <p className="mt-1 text-sm text-muted-warm">
                  Theo dõi phiên đã tạo, giá hiện tại và số người tham gia.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => void auctionsQuery.refetch()}
                className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
              >
                <RefreshCw className={cn("size-4", auctionsQuery.isFetching && "animate-spin")} />
                Làm mới
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-[#4e4637]/10 px-6 py-3">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => handleFilterChange(filter)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                    activeFilter.id === filter.id
                      ? "border-ink-blue bg-ink-blue text-white"
                      : "border-[#4e4637]/15 bg-white text-muted-warm hover:border-brushed-brass/40 hover:text-ink-blue",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {auctionsQuery.isError ? (
              <ErrorState onRetry={() => void auctionsQuery.refetch()} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#4e4637]/15 bg-[#F6F0E6]/60">
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Phiên
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Giá
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Lịch
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Người tham gia
                        </th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#4e4637]/10">
                      {auctionsQuery.isPending ? (
                        <AuctionTableSkeleton />
                      ) : auctions.length === 0 ? (
                        <tr>
                          <td colSpan={6}>
                            <EmptyState activeFilter={activeFilter} />
                          </td>
                        </tr>
                      ) : (
                        auctions.map((auction) => (
                          <AuctionRow
                            key={auction.id}
                            auction={auction}
                            isSuspended={isSuspended}
                            onCancel={setCancelTarget}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {!auctionsQuery.isPending && auctions.length > 0 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={meta?.total ?? auctions.length}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <Dialog
        open={cancelTarget !== null && !isSuspended}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy phiên đấu giá?</DialogTitle>
            <DialogDescription>
              Phiên của sản phẩm “{cancelTarget?.title}” sẽ chuyển sang trạng thái đã hủy. Sản phẩm
              sẽ quay lại trạng thái sẵn sàng tạo phiên mới.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Giữ lại
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-4" aria-hidden />
              )}
              Hủy phiên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuctionStatusBadge({ status }: { status: SellerAuctionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border shadow-2xs transition-colors whitespace-nowrap",
        SELLER_AUCTION_STATUS_CLASS[status],
      )}
    >
      {SELLER_AUCTION_STATUS_LABEL[status]}
    </span>
  );
}

function AuctionRow({
  auction,
  isSuspended,
  onCancel,
}: {
  auction: SellerAuction;
  isSuspended: boolean;
  onCancel: (auction: SellerAuction) => void;
}) {
  const canCancel = !isSuspended && auction.status === "WAITING";

  return (
    <tr className="transition-colors hover:bg-[#F6F0E6]/30">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-[#4e4637]/20 bg-[#eae1d6] text-ink-blue overflow-hidden shadow-2xs">
            {auction.imageUrl ? (
              <img
                src={auction.imageUrl}
                alt={auction.title}
                className="size-full object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <Gavel className="size-6 text-muted-warm" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <Link
              to={SELLER_PATHS.auctionDetail(auction.id)}
              className="block truncate text-sm font-bold text-ink-blue transition-colors hover:text-brushed-brass"
            >
              {auction.title}
            </Link>
            <p className="mt-1 text-xs text-muted-warm">
              Phiên #{auction.id} · SP #{auction.productId}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <AuctionStatusBadge status={auction.status} />
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1 text-xs whitespace-nowrap">
          <p className="text-sm font-bold text-ink-blue">
            <span className="text-[10px] font-medium text-muted-warm mr-1">Hiện tại:</span>
            {formatVND(auction.currentPrice)}
          </p>
          <p className="text-muted-warm">
            <span className="font-semibold text-ink-blue mr-1">Khởi điểm:</span>
            {formatVND(auction.startingPrice)}
          </p>
          <p className="text-muted-warm">
            <span className="font-semibold text-ink-blue mr-1">Tiền cọc:</span>
            {formatVND(auction.depositAmount)}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-start gap-2.5 text-xs text-muted-warm">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-brushed-brass" aria-hidden />
          <div className="space-y-1 whitespace-nowrap">
            <p>
              <span className="font-semibold text-ink-blue">Bắt đầu:</span>{" "}
              {formatDateTime(auction.startTime)}
            </p>
            <p>
              <span className="font-semibold text-ink-blue">Kết thúc:</span>{" "}
              {formatDateTime(auction.endTime)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-blue">
          <Users className="size-4 text-muted-warm" aria-hidden />
          {auction.bidCount}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <Button
            asChild
            type="button"
            size="sm"
            variant="outline"
            className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
          >
            <Link to={SELLER_PATHS.auctionDetail(auction.id)}>
              <Eye className="size-4" aria-hidden />
              Xem
            </Link>
          </Button>
          {canCancel && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onCancel(auction)}
              className="border-red-500/25 bg-white text-red-600 hover:bg-red-50 hover:text-red-600 hover:border-red-500/40 active:scale-97 transition-all cursor-pointer"
            >
              <Trash2 className="size-4" aria-hidden />
              Hủy
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ink" | "muted" | "brass" | "green" | "red";
}) {
  const toneClasses = {
    ink: { text: "text-ink-blue", bar: "bg-ink-blue" },
    muted: { text: "text-[#8D877C]", bar: "bg-[#8D877C]" },
    brass: { text: "text-brushed-brass", bar: "bg-brushed-brass" },
    green: { text: "text-verdigris", bar: "bg-verdigris" },
    red: { text: "text-terracotta", bar: "bg-terracotta" },
  }[tone];

  return (
    <div className="rounded-lg border border-[#4e4637]/15 bg-white p-4 shadow-sm">
      <div className={cn("mb-4 h-1 w-10 rounded-full", toneClasses.bar)} />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-warm">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold tabular-nums", toneClasses.text)}>{value}</p>
    </div>
  );
}

function EmptyState({ activeFilter }: { activeFilter: AuctionFilter }) {
  const message =
    activeFilter.id === "ALL"
      ? "Bạn chưa có phiên đấu giá nào."
      : `Chưa có phiên ở trạng thái ${activeFilter.label}.`;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <PackageSearch className="size-11 text-[#8D877C]/40" aria-hidden />
      <p className="mt-4 text-sm font-semibold text-ink-blue">{message}</p>
      <Button asChild className="mt-4 bg-brushed-brass text-[#181612] hover:bg-brushed-brass/90">
        <Link to={SELLER_PATHS.newAuction}>Tạo phiên đấu giá</Link>
      </Button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <AlertTriangle className="size-10 text-terracotta" aria-hidden />
      <p className="mt-4 text-sm font-semibold text-ink-blue">Không thể tải danh sách phiên</p>
      <p className="mt-1 text-sm text-muted-warm">Vui lòng kiểm tra kết nối và thử lại.</p>
      <Button
        type="button"
        onClick={onRetry}
        className="mt-4 bg-ink-blue text-white hover:bg-ink-blue/90"
      >
        <RefreshCw className="size-4" aria-hidden />
        Thử lại
      </Button>
    </div>
  );
}

function AuctionTableSkeleton() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={index}>
      {Array.from({ length: 6 }, (_, column) => (
        <td key={column} className="px-6 py-5">
          <div className="h-4 animate-pulse rounded bg-[#eae1d6]" />
        </td>
      ))}
    </tr>
  ));
}

function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <div className="border-t border-[#4e4637]/10 px-6 py-4 text-sm text-muted-warm">
        {totalItems} phiên
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#4e4637]/10 px-6 py-4">
      <p className="text-sm text-muted-warm">{totalItems} phiên</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
          aria-label="Trang trước"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <span className="min-w-20 text-center text-sm font-semibold text-ink-blue">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
          aria-label="Trang sau"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
