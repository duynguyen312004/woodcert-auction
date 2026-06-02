/**
 * Màn quản lý sản phẩm của seller.
 *
 * Đây là điểm vào chính của mục Sản phẩm: xem danh sách, lọc trạng thái,
 * chuyển sang form đăng sản phẩm mới và gửi bản nháp đi kiểm định.
 */
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Gavel,
  Loader2,
  PackagePlus,
  Pencil,
  RefreshCw,
  SendHorizonal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { isApiError } from "@/shared/api/errors";
import { formatDate, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useNotification } from "@/shared/ui/notification";

import { ProductSaleStatusBadge, ProductStatusBadge } from "../components/ProductStatusBadge";
import { ProductTableSkeleton } from "../components/ProductTableSkeleton";
import { PRODUCT_SALE_STATUS_LABEL, PRODUCT_STATUS_LABEL } from "../constants/productStatus";
import { SELLER_PATHS } from "../constants/routes";
import { useSubmitAppraisal } from "../hooks/useProductMutations";
import { useSellerProducts } from "../hooks/useSellerDashboard";
import type { ProductSaleStatus, ProductStatus, SellerProduct } from "../types";

const PAGE_SIZE = 10;
const APPRAISAL_FEE = 1_000_000;

type ProductListFilter = {
  id: string;
  label: string;
  status?: ProductStatus;
  saleStatus?: ProductSaleStatus;
};

const ALL_PRODUCTS_FILTER: ProductListFilter = { id: "ALL", label: "Tất cả" };

const STATUS_TABS: ProductListFilter[] = [
  ALL_PRODUCTS_FILTER,
  { id: "DRAFT", label: PRODUCT_STATUS_LABEL.DRAFT, status: "DRAFT" },
  {
    id: "PENDING_APPRAISAL",
    label: PRODUCT_STATUS_LABEL.PENDING_APPRAISAL,
    status: "PENDING_APPRAISAL",
  },
  { id: "APPRAISED", label: PRODUCT_STATUS_LABEL.APPRAISED, status: "APPRAISED" },
  { id: "IN_AUCTION", label: PRODUCT_SALE_STATUS_LABEL.IN_AUCTION, saleStatus: "IN_AUCTION" },
  {
    id: "PENDING_ORDER",
    label: PRODUCT_SALE_STATUS_LABEL.PENDING_ORDER,
    saleStatus: "PENDING_ORDER",
  },
  { id: "SOLD", label: PRODUCT_SALE_STATUS_LABEL.SOLD, saleStatus: "SOLD" },
  { id: "RETURNED", label: PRODUCT_SALE_STATUS_LABEL.RETURNED, saleStatus: "RETURNED" },
  { id: "REJECTED", label: PRODUCT_STATUS_LABEL.REJECTED, status: "REJECTED" },
];

export function SellerProductsPage() {
  const [activeFilter, setActiveFilter] = useState<ProductListFilter>(ALL_PRODUCTS_FILTER);
  const [page, setPage] = useState(1);
  const [submittingProductId, setSubmittingProductId] = useState<string | null>(null);
  const notification = useNotification();
  const submitAppraisalMutation = useSubmitAppraisal();

  const listParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      ...(activeFilter.status ? { status: activeFilter.status } : {}),
      ...(activeFilter.saleStatus ? { saleStatus: activeFilter.saleStatus } : {}),
    }),
    [activeFilter, page],
  );

  const productsQuery = useSellerProducts(listParams);
  const statsQuery = useSellerProducts({ size: 100 });

  const products = productsQuery.data?.result ?? [];
  const meta = productsQuery.data?.meta;
  const totalPages = meta?.pages ?? 1;
  const totalProducts = statsQuery.data?.meta.total ?? productsQuery.data?.meta.total ?? 0;

  const statusCounts = useMemo(() => {
    const items = statsQuery.data?.result ?? [];
    return items.reduce<Record<ProductStatus, number>>(
      (acc, product) => {
        acc[product.status] += 1;
        return acc;
      },
      {
        DRAFT: 0,
        PENDING_APPRAISAL: 0,
        UNDER_APPRAISAL: 0,
        REJECTED: 0,
        APPRAISED: 0,
      },
    );
  }, [statsQuery.data]);

  const saleStatusCounts = useMemo(() => {
    const items = statsQuery.data?.result ?? [];
    return items.reduce<Record<ProductSaleStatus, number>>(
      (acc, product) => {
        acc[product.saleStatus] += 1;
        return acc;
      },
      {
        AVAILABLE: 0,
        IN_AUCTION: 0,
        PENDING_ORDER: 0,
        SOLD: 0,
        RETURNED: 0,
      },
    );
  }, [statsQuery.data]);

  const handleFilterChange = (filter: ProductListFilter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleSubmitAppraisal = async (product: SellerProduct) => {
    const confirmed = window.confirm(
      `Gửi kiểm định sẽ trừ ${formatVND(APPRAISAL_FEE)} từ ví seller và phí này không hoàn lại nếu sản phẩm bị từ chối.`,
    );
    if (!confirmed) return;

    setSubmittingProductId(product.id);
    try {
      await submitAppraisalMutation.mutateAsync(Number(product.id));
      notification.success("Đã gửi yêu cầu kiểm định", {
        description: product.title,
      });
    } catch (error: unknown) {
      notification.error("Không thể gửi kiểm định", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại sau.",
      });
    } finally {
      setSubmittingProductId(null);
    }
  };

  const isLoading = productsQuery.isPending;

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex min-h-[68px] shrink-0 items-center justify-between gap-4 border-b border-[#4e4637]/20 bg-warm-ivory/85 px-8 py-3 backdrop-blur-md">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brushed-brass">
            Seller Portal
          </p>
          <h1 className="font-serif text-xl font-bold text-ink-blue">Quản lý sản phẩm</h1>
        </div>

        <Button asChild className="bg-brushed-brass text-[#181612] hover:bg-brushed-brass/90">
          <Link to={SELLER_PATHS.newProduct}>
            <PackagePlus className="size-4" aria-hidden />
            Đăng sản phẩm
          </Link>
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] space-y-6 p-8">
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-5" aria-label="Thống kê sản phẩm">
            <StatCard label="Tổng sản phẩm" value={totalProducts} tone="ink" />
            <StatCard label={PRODUCT_STATUS_LABEL.DRAFT} value={statusCounts.DRAFT} tone="muted" />
            <StatCard
              label={PRODUCT_STATUS_LABEL.PENDING_APPRAISAL}
              value={statusCounts.PENDING_APPRAISAL}
              tone="brass"
            />
            <StatCard
              label={PRODUCT_STATUS_LABEL.APPRAISED}
              value={statusCounts.APPRAISED}
              tone="green"
            />
            <StatCard
              label={PRODUCT_SALE_STATUS_LABEL.IN_AUCTION}
              value={saleStatusCounts.IN_AUCTION}
              tone="blue"
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-[#4e4637]/15 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#4e4637]/10 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-ink-blue">Danh sách sản phẩm</h2>
                <p className="mt-1 text-sm text-muted-warm">
                  Theo dõi trạng thái kiểm định và chuẩn bị sản phẩm đủ điều kiện đấu giá.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => void productsQuery.refetch()}
                className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
              >
                <RefreshCw className={cn("size-4", productsQuery.isFetching && "animate-spin")} />
                Làm mới
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-[#4e4637]/10 px-6 py-3">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilterChange(tab)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                    activeFilter.id === tab.id
                      ? "border-ink-blue bg-ink-blue text-white"
                      : "border-[#4e4637]/15 bg-white text-muted-warm hover:border-brushed-brass/40 hover:text-ink-blue",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {productsQuery.isError ? (
              <ErrorState onRetry={() => void productsQuery.refetch()} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead>
                      <tr className="bg-[#F6F0E6]/60 border-b border-[#4e4637]/15">
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Sản phẩm
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Chất liệu
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Ngày tạo
                        </th>
                        <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-muted-warm">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#4e4637]/10">
                      {isLoading ? (
                        <ProductTableSkeleton columns={5} />
                      ) : products.length === 0 ? (
                        <tr>
                          <td colSpan={5}>
                            <EmptyState activeFilter={activeFilter} />
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => (
                          <ProductManagementRow
                            key={product.id}
                            product={product}
                            isSubmitting={submittingProductId === product.id}
                            onSubmitAppraisal={handleSubmitAppraisal}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {!isLoading && products.length > 0 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={meta?.total ?? products.length}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ink" | "muted" | "brass" | "green" | "blue";
}) {
  const toneClasses = {
    ink: { text: "text-ink-blue", bar: "bg-ink-blue" },
    muted: { text: "text-[#8D877C]", bar: "bg-[#8D877C]" },
    brass: { text: "text-brushed-brass", bar: "bg-brushed-brass" },
    green: { text: "text-verdigris", bar: "bg-verdigris" },
    blue: { text: "text-ink-blue", bar: "bg-ink-blue" },
  }[tone];

  return (
    <div className="rounded-lg border border-[#4e4637]/15 bg-white p-4 shadow-sm">
      <div className={cn("mb-4 h-1 w-10 rounded-full", toneClasses.bar)} />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-warm">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold tabular-nums", toneClasses.text)}>{value}</p>
    </div>
  );
}

function ProductManagementRow({
  product,
  isSubmitting,
  onSubmitAppraisal,
}: {
  product: SellerProduct;
  isSubmitting: boolean;
  onSubmitAppraisal: (product: SellerProduct) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const canSubmitAppraisal = product.status === "DRAFT" && product.saleStatus === "AVAILABLE";
  const canCreateAuction = product.status === "APPRAISED" && product.saleStatus === "AVAILABLE";

  return (
    <tr className="transition-colors hover:bg-[#F6F0E6]/60">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="size-12 shrink-0 overflow-hidden rounded border border-[#4e4637]/20 bg-[#eae1d6]">
            {product.imageUrl && !imgFailed ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="size-full object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ClipboardList className="size-5 text-[#8D877C]" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink-blue">{product.title}</p>
            <p className="mt-0.5 text-xs text-muted-warm">Mã SP #{product.id}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-warm">{product.woodType || "—"}</td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1.5">
          <ProductStatusBadge status={product.status} />
          {product.saleStatus !== "AVAILABLE" && (
            <ProductSaleStatusBadge status={product.saleStatus} />
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-warm">{formatDate(product.createdAt)}</td>
      <td className="px-6 py-4 text-right">
        {canSubmitAppraisal ? (
          <div className="flex justify-end gap-2">
            <Button
              asChild
              type="button"
              size="sm"
              variant="outline"
              className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
            >
              <Link to={SELLER_PATHS.editProduct(product.id)} aria-label="Chinh sua san pham">
                <Pencil className="size-4" aria-hidden />
                Chỉnh sửa
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onSubmitAppraisal(product)}
              disabled={isSubmitting}
              className="bg-ink-blue text-white hover:bg-ink-blue/90"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <SendHorizonal className="size-4" aria-hidden />
              )}
              Gửi kiểm định
            </Button>
          </div>
        ) : canCreateAuction ? (
          <Button
            asChild
            type="button"
            size="sm"
            className="bg-ink-blue text-white hover:bg-ink-blue/90"
          >
            <Link to={`${SELLER_PATHS.newAuction}?productId=${product.id}`}>
              <Gavel className="size-4" aria-hidden />
              Tạo phiên
            </Link>
          </Button>
        ) : (
          <span className="text-xs font-semibold text-muted-warm">Không có thao tác</span>
        )}
      </td>
    </tr>
  );
}

function EmptyState({ activeFilter }: { activeFilter: ProductListFilter }) {
  const message =
    activeFilter.id === "ALL"
      ? "Bạn chưa có sản phẩm nào."
      : `Chưa có sản phẩm ở trạng thái ${activeFilter.label}.`;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-brushed-brass/10 text-brushed-brass">
        <PackagePlus className="size-6" aria-hidden />
      </div>
      <p className="mt-4 text-sm font-semibold text-ink-blue">{message}</p>
      <Button asChild className="mt-4 bg-brushed-brass text-[#181612] hover:bg-brushed-brass/90">
        <Link to={SELLER_PATHS.newProduct}>Đăng sản phẩm mới</Link>
      </Button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <AlertTriangle className="size-10 text-terracotta" aria-hidden />
      <p className="mt-4 text-sm font-semibold text-ink-blue">Không thể tải danh sách sản phẩm</p>
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
        {totalItems} sản phẩm
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#4e4637]/10 px-6 py-4">
      <p className="text-sm text-muted-warm">{totalItems} sản phẩm</p>
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
