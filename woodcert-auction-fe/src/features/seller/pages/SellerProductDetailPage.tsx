import { Link, useParams } from "react-router";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";

import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";

import { ProductSaleStatusBadge, ProductStatusBadge } from "../components/ProductStatusBadge";
import { SELLER_PATHS } from "../constants/routes";
import { useSellerProductDetail } from "../hooks/useSellerDashboard";

export function SellerProductDetailPage() {
  const { productId } = useParams();
  const id = productId ? Number(productId) : undefined;
  const query = useSellerProductDetail(Number.isFinite(id) ? id : undefined);
  const product = query.data;

  if (query.isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brushed-brass" />
      </div>
    );
  }

  if (!product) {
    return <div className="p-8 text-muted-warm">Không tìm thấy sản phẩm.</div>;
  }

  return (
    <div className="min-h-full bg-warm-ivory text-[#181612]">
      <header className="sticky top-0 z-10 flex min-h-[68px] items-center justify-between border-b border-[#4e4637]/20 bg-warm-ivory/85 px-8 backdrop-blur-md">
        <Button asChild variant="outline">
          <Link to={SELLER_PATHS.products}>
            <ArrowLeft className="h-4 w-4" />
            Sản phẩm
          </Link>
        </Button>
        {product.status === "DRAFT" && (
          <Button asChild>
            <Link to={SELLER_PATHS.editProduct(product.id)}>
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>
        )}
      </header>

      <main className="mx-auto grid max-w-[1180px] gap-6 p-8 lg:grid-cols-[420px_1fr]">
        <section className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-lg border border-[#4e4637]/15 bg-white">
            {product.images[0]?.imageUrl ? (
              <img
                src={product.images[0].imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-warm">
                Chưa có ảnh
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.slice(1, 5).map((image) => (
              <img
                key={image.id}
                src={image.imageUrl}
                alt=""
                className="aspect-square rounded border border-[#4e4637]/15 object-cover"
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#4e4637]/15 bg-white p-6">
          <div className="flex flex-wrap gap-2">
            <ProductStatusBadge status={product.status} />
            <ProductSaleStatusBadge status={product.saleStatus} />
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold text-ink-blue">{product.title}</h1>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#4e4637]">
            {product.description ?? "Không có mô tả."}
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Info label="Danh mục" value={product.category?.name ?? "—"} />
            <Info label="Chất liệu" value={product.material ?? "—"} />
            <Info label="Kích thước" value={product.dimensions ?? "—"} />
            <Info label="Khối lượng" value={product.weight ? `${product.weight} kg` : "—"} />
            <Info label="Ngày tạo" value={formatDateTime(product.createdAt)} />
            <Info
              label="Gửi kiểm định"
              value={product.submittedAt ? formatDateTime(product.submittedAt) : "—"}
            />
            <Info label="Lý do từ chối" value={product.rejectedReason ?? "—"} wide />
          </dl>
        </section>
      </main>
    </div>
  );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-bold uppercase tracking-widest text-muted-warm">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}
