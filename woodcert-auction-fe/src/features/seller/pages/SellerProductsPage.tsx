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
  Eye,
  Gavel,
  PackagePlus,
  Pencil,
  RefreshCw,
  SendHorizonal,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router";

import { formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { isApiError } from "@/shared/api/errors";
import { NotificationCard, useNotification } from "@/shared/ui/notification";

import { AppraisalSubmissionDialog } from "../components/AppraisalSubmissionDialog";
import { ProductSaleStatusBadge, ProductStatusBadge } from "../components/ProductStatusBadge";
import { ProductTableSkeleton } from "../components/ProductTableSkeleton";
import { useSellerCapability } from "../components/SellerCapabilityProvider";
import { PRODUCT_SALE_STATUS_LABEL, PRODUCT_STATUS_LABEL } from "../constants/productStatus";
import { SELLER_PATHS } from "../constants/routes";
import { useDeleteProduct, useSubmitAppraisal } from "../hooks/useProductMutations";
import { useSellerProducts, useSellerProductStats } from "../hooks/useSellerDashboard";
import type { ProductSaleStatus, ProductStatus, SellerProduct } from "../types";

const PAGE_SIZE = 10;

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
  const { isSuspended } = useSellerCapability();
  const [activeFilter, setActiveFilter] = useState<ProductListFilter>(ALL_PRODUCTS_FILTER);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<SellerProduct | null>(null);
  const [submittedProductTitle, setSubmittedProductTitle] = useState<string | null>(null);
  const submitAppraisalMutation = useSubmitAppraisal();
  const deleteProductMutation = useDeleteProduct();
  const notification = useNotification();

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
  const statsQuery = useSellerProductStats();

  const products = productsQuery.data?.result ?? [];
  const meta = productsQuery.data?.meta;
  const totalPages = meta?.pages ?? 1;
  const totalProducts = statsQuery.data?.total ?? productsQuery.data?.meta.total ?? 0;
  const statusCounts = statsQuery.data?.byStatus ?? {
    DRAFT: 0,
    PENDING_APPRAISAL: 0,
    UNDER_APPRAISAL: 0,
    REJECTED: 0,
    APPRAISED: 0,
  };
  const saleStatusCounts = statsQuery.data?.bySaleStatus ?? {
    AVAILABLE: 0,
    IN_AUCTION: 0,
    PENDING_ORDER: 0,
    SOLD: 0,
    RETURNED: 0,
  };

  const handleFilterChange = (filter: ProductListFilter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleSubmitAppraisal = async () => {
    if (!selectedProduct || isSuspended) return;
    await submitAppraisalMutation.mutateAsync(Number(selectedProduct.id));
  };

  const isLoading = productsQuery.isPending;

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    try {
      await deleteProductMutation.mutateAsync(Number(deleteProduct.id));
      notification.success("Đã xóa bản nháp");
      setDeleteProduct(null);
    } catch (error) {
      notification.error("Không thể xóa sản phẩm", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
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
          <h1 className="font-serif text-xl font-bold text-ink-blue">Quản lý sản phẩm</h1>
        </div>

        {isSuspended ? (
          <Button disabled title="Quyền bán đang bị đình chỉ">
            <PackagePlus className="size-4" aria-hidden />
            Đăng sản phẩm
          </Button>
        ) : (
          <Button asChild className="bg-brushed-brass text-[#181612] hover:bg-brushed-brass/90">
            <Link to={SELLER_PATHS.newProduct}>
              <PackagePlus className="size-4" aria-hidden />
              Đăng sản phẩm
            </Link>
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] space-y-6 p-8">
          {submittedProductTitle && (
            <NotificationCard
              tone="success"
              title="Đã gửi yêu cầu kiểm định"
              description={
                <>
                  Sản phẩm <strong>{submittedProductTitle}</strong> đã được chuyển vào hàng chờ kiểm
                  định. Lệ phí đã được trừ từ ví seller.
                </>
              }
              onDismiss={() => setSubmittedProductTitle(null)}
              className="border-verdigris/20 bg-white shadow-sm"
            />
          )}

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
                            isSuspended={isSuspended}
                            onSubmitAppraisal={setSelectedProduct}
                            onDelete={setDeleteProduct}
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

      <AppraisalSubmissionDialog
        open={selectedProduct !== null && !isSuspended}
        productTitle={selectedProduct?.title ?? ""}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
        onConfirm={handleSubmitAppraisal}
        onSuccess={() => {
          setSubmittedProductTitle(selectedProduct?.title ?? null);
          setSelectedProduct(null);
        }}
      />
      <Dialog
        open={deleteProduct !== null}
        onOpenChange={(open) => !open && setDeleteProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bản nháp?</DialogTitle>
            <DialogDescription>
              Sản phẩm “{deleteProduct?.title}” sẽ bị xóa vĩnh viễn. Chỉ bản nháp chưa gửi kiểm định
              mới có thể xóa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteProduct(null)}>
              Giữ lại
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteProductMutation.isPending}
              onClick={() => void handleDeleteProduct()}
            >
              {deleteProductMutation.isPending ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Xóa bản nháp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  isSuspended,
  onSubmitAppraisal,
  onDelete,
}: {
  product: SellerProduct;
  isSuspended: boolean;
  onSubmitAppraisal: (product: SellerProduct) => void;
  onDelete: (product: SellerProduct) => void;
}) {
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);
  const canSubmitAppraisal =
    !isSuspended && product.status === "DRAFT" && product.saleStatus === "AVAILABLE";
  const canCreateAuction =
    !isSuspended && product.status === "APPRAISED" && product.saleStatus === "AVAILABLE";
  const detailPath = SELLER_PATHS.productDetail(product.id);

  const openDetailFromRow = (event: MouseEvent<HTMLTableRowElement>) => {
    if ((event.target as Element).closest("a, button, input, select, textarea")) return;
    void navigate(detailPath);
  };

  const openDetailFromKeyboard = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if ((event.target as Element).closest("a, button, input, select, textarea")) return;
    event.preventDefault();
    void navigate(detailPath);
  };

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`Xem chi tiết ${product.title}`}
      onClick={openDetailFromRow}
      onKeyDown={openDetailFromKeyboard}
      className="cursor-pointer transition-colors hover:bg-[#F6F0E6]/60 focus-visible:bg-[#F6F0E6]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brushed-brass/40"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            to={detailPath}
            className="size-12 shrink-0 overflow-hidden rounded border border-[#4e4637]/20 bg-[#eae1d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass/50"
            aria-label={`Xem ảnh và chi tiết ${product.title}`}
          >
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
          </Link>
          <div className="min-w-0">
            <Link
              to={detailPath}
              className="block truncate text-sm font-bold text-ink-blue transition-colors hover:text-brushed-brass hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass/50"
            >
              {product.title}
            </Link>
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
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            asChild
            type="button"
            size="sm"
            variant="outline"
            className="border-[#4e4637]/20 bg-white text-ink-blue hover:border-brushed-brass/40 hover:bg-[#eae1d6]/50 hover:text-ink-blue"
          >
            <Link to={detailPath}>
              <Eye className="size-4" aria-hidden />
              Xem chi tiết
            </Link>
          </Button>

          {canSubmitAppraisal && (
            <>
              <Button
                asChild
                type="button"
                size="sm"
                variant="outline"
                className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
              >
                <Link to={SELLER_PATHS.editProduct(product.id)} aria-label="Chỉnh sửa sản phẩm">
                  <Pencil className="size-4" aria-hidden />
                  Chỉnh sửa
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onDelete(product)}
                className="border-terracotta/30 text-terracotta hover:bg-terracotta/10 hover:text-terracotta"
              >
                <Trash2 className="size-4" aria-hidden />
                Xóa
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => onSubmitAppraisal(product)}
                className="bg-ink-blue text-white hover:bg-ink-blue/90"
              >
                <SendHorizonal className="size-4" aria-hidden />
                Gửi kiểm định
              </Button>
            </>
          )}

          {canCreateAuction && (
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
          )}
        </div>
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
