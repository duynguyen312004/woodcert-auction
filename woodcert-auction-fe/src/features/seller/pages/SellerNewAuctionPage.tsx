/**
 * Trang tạo phiên đấu giá cho sản phẩm seller đã được kiểm định.
 *
 * Form chỉ nhận sản phẩm APPRAISED + AVAILABLE và validate cùng ngưỡng với backend AuctionPolicy.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Gavel,
  Loader2,
  PackageCheck,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { isApiError } from "@/shared/api/errors";
import { formatVND } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NotificationCard, useNotification } from "@/shared/ui/notification";

import { ProductSaleStatusBadge, ProductStatusBadge } from "../components/ProductStatusBadge";
import { SELLER_PATHS } from "../constants/routes";
import { useCreateAuctionSession } from "../hooks/useProductMutations";
import { useSellerProducts } from "../hooks/useSellerDashboard";
import {
  createAuctionSessionSchema,
  type CreateAuctionSessionFormValues,
  type SellerProduct,
} from "../types";

const ELIGIBLE_PRODUCTS_SIZE = 50;
const MIN_STEP_PRICE = 100000;
const MIN_DEPOSIT_AMOUNT = 1000000;

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatMoneyInput(value: string | number) {
  const digits = digitsOnly(String(value));
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function toLocalDateTimeInput(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parseMoney(value: string) {
  const parsed = Number(digitsOnly(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function productQueryId(searchParams: URLSearchParams) {
  const raw = searchParams.get("productId");
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function SellerNewAuctionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const notification = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const preferredProductId = productQueryId(searchParams);
  const earliestStart = useMemo(() => toLocalDateTimeInput(new Date(Date.now() + 5 * 60_000)), []);

  const eligibleProductsQuery = useSellerProducts({
    status: "APPRAISED",
    saleStatus: "AVAILABLE",
    size: ELIGIBLE_PRODUCTS_SIZE,
  });
  const createMutation = useCreateAuctionSession();

  const eligibleProducts = useMemo(
    () => eligibleProductsQuery.data?.result ?? [],
    [eligibleProductsQuery.data?.result],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAuctionSessionFormValues>({
    resolver: zodResolver(createAuctionSessionSchema),
    defaultValues: {
      productId: preferredProductId,
      startingPrice: "",
      reservePrice: "",
      stepPrice: formatMoneyInput(MIN_STEP_PRICE),
      depositAmount: formatMoneyInput(MIN_DEPOSIT_AMOUNT),
      startTime: earliestStart,
      endTime: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedProductId = watch("productId");
  const watchedStartingPrice = watch("startingPrice");
  const watchedDepositAmount = watch("depositAmount");
  const watchedReservePrice = watch("reservePrice");
  const selectedProduct = eligibleProducts.find(
    (product) => Number(product.id) === watchedProductId,
  );
  const startingPrice = parseMoney(watchedStartingPrice);
  const maxDeposit = Math.floor(startingPrice * 0.5);
  const depositAmount = parseMoney(watchedDepositAmount);
  const reservePrice = parseMoney(watchedReservePrice);
  const isSaving = isSubmitting || createMutation.isPending;

  useEffect(() => {
    if (
      preferredProductId > 0 &&
      eligibleProducts.some((product) => Number(product.id) === preferredProductId)
    ) {
      setValue("productId", preferredProductId, { shouldValidate: true });
    }
  }, [eligibleProducts, preferredProductId, setValue]);

  const onSubmit = async (values: CreateAuctionSessionFormValues) => {
    setSubmitError(null);

    try {
      await createMutation.mutateAsync({
        productId: values.productId,
        startingPrice: parseMoney(values.startingPrice),
        reservePrice: parseMoney(values.reservePrice),
        stepPrice: parseMoney(values.stepPrice),
        depositAmount: parseMoney(values.depositAmount),
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
      });

      notification.success("Đã tạo phiên đấu giá", {
        description: selectedProduct?.title ?? "Phiên mới đã được lưu.",
      });
      navigate(SELLER_PATHS.auctions);
    } catch (error: unknown) {
      setSubmitError(
        isApiError(error)
          ? error.message
          : "Không thể tạo phiên đấu giá. Vui lòng kiểm tra dữ liệu và thử lại.",
      );
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-[68px] shrink-0 items-center gap-3 border-b border-[#4e4637]/20 bg-warm-ivory/85 px-8 backdrop-blur-md">
        <Link
          to={SELLER_PATHS.auctions}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-warm transition-colors hover:text-ink-blue"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Phiên đấu giá
        </Link>
        <ChevronRight className="size-3.5 text-muted-warm/50" aria-hidden />
        <h1 className="font-serif text-lg font-bold text-ink-blue">Tạo phiên đấu giá</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] space-y-6 p-8">
          {submitError && (
            <NotificationCard
              tone="error"
              title="Không thể tạo phiên đấu giá"
              description={submitError}
            />
          )}

          {eligibleProductsQuery.isError ? (
            <BlockingState
              icon="warning"
              title="Không thể tải sản phẩm đủ điều kiện"
              description="Vui lòng kiểm tra kết nối hoặc thử lại sau."
              actionLabel="Tải lại"
              onAction={() => void eligibleProductsQuery.refetch()}
            />
          ) : eligibleProductsQuery.isPending ? (
            <BlockingState
              icon="loading"
              title="Đang tải sản phẩm đã kiểm định"
              description="Hệ thống đang lấy danh sách sản phẩm sẵn sàng đưa lên đấu giá."
            />
          ) : eligibleProducts.length === 0 ? (
            <EmptyEligibleProducts />
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="overflow-hidden rounded-xl border border-[#4e4637]/15 bg-white shadow-sm lg:col-span-8"
              >
                <section className="p-8">
                  <SectionHeader
                    icon={<PackageCheck className="size-4" aria-hidden />}
                    title="Sản phẩm đưa lên đấu giá"
                    tone="brass"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="productId">Sản phẩm đã kiểm định</Label>
                    <select
                      id="productId"
                      className="h-10 w-full rounded-md border border-[#4e4637]/20 bg-white px-3 text-sm text-[#181612] shadow-sm focus-visible:border-brushed-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass/35"
                      {...register("productId", { valueAsNumber: true })}
                      aria-invalid={!!errors.productId}
                    >
                      <option value={0}>-- Chọn sản phẩm --</option>
                      {eligibleProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          #{product.id} - {product.title}
                        </option>
                      ))}
                    </select>
                    {errors.productId && (
                      <p className="text-sm text-red-500" role="alert">
                        {errors.productId.message}
                      </p>
                    )}
                  </div>

                  {selectedProduct && <SelectedProductPreview product={selectedProduct} />}
                </section>

                <div className="mx-8 h-px bg-[#4e4637]/10" />

                <section className="p-8">
                  <SectionHeader
                    icon={<Gavel className="size-4" aria-hidden />}
                    title="Giá và tiền cọc"
                    tone="ink"
                  />

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <MoneyField
                      id="startingPrice"
                      label="Giá khởi điểm"
                      register={register("startingPrice", {
                        onChange: (event) => {
                          event.target.value = formatMoneyInput(event.target.value);
                        },
                      })}
                      error={errors.startingPrice?.message}
                    />
                    <MoneyField
                      id="reservePrice"
                      label="Giá sàn"
                      register={register("reservePrice", {
                        onChange: (event) => {
                          event.target.value = formatMoneyInput(event.target.value);
                        },
                      })}
                      error={errors.reservePrice?.message}
                    />
                    <MoneyField
                      id="stepPrice"
                      label="Bước giá"
                      register={register("stepPrice", {
                        onChange: (event) => {
                          event.target.value = formatMoneyInput(event.target.value);
                        },
                      })}
                      error={errors.stepPrice?.message}
                    />
                    <MoneyField
                      id="depositAmount"
                      label="Tiền cọc"
                      register={register("depositAmount", {
                        onChange: (event) => {
                          event.target.value = formatMoneyInput(event.target.value);
                        },
                      })}
                      error={errors.depositAmount?.message}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 rounded-lg border border-ink-blue/15 bg-ink-blue/5 p-4 text-sm md:grid-cols-3">
                    <PriceHint
                      label="Cọc tối đa"
                      value={startingPrice > 0 ? formatVND(maxDeposit) : "—"}
                    />
                    <PriceHint
                      label="Cọc đang nhập"
                      value={depositAmount > 0 ? formatVND(depositAmount) : "—"}
                    />
                    <PriceHint
                      label="Giá sàn"
                      value={reservePrice > 0 ? formatVND(reservePrice) : "—"}
                    />
                  </div>
                </section>

                <div className="mx-8 h-px bg-[#4e4637]/10" />

                <section className="p-8">
                  <SectionHeader
                    icon={<CalendarClock className="size-4" aria-hidden />}
                    title="Thời gian phiên"
                    tone="green"
                  />

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <DateTimeField
                      id="startTime"
                      label="Bắt đầu"
                      min={earliestStart}
                      register={register("startTime")}
                      error={errors.startTime?.message}
                    />
                    <DateTimeField
                      id="endTime"
                      label="Kết thúc"
                      register={register("endTime")}
                      error={errors.endTime?.message}
                    />
                  </div>
                </section>

                <div className="flex flex-wrap items-center gap-3 border-t border-[#4e4637]/10 px-8 pb-8 pt-6">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-ink-blue text-white hover:bg-ink-blue/90"
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Gavel className="size-4" aria-hidden />
                    )}
                    Tạo phiên đấu giá
                  </Button>
                  <Button
                    asChild
                    type="button"
                    variant="outline"
                    className="border-[#4e4637]/20 bg-white text-ink-blue hover:bg-[#eae1d6]/50 hover:text-ink-blue hover:border-brushed-brass/40 active:scale-97 transition-all cursor-pointer"
                  >
                    <Link to={SELLER_PATHS.auctions}>Hủy</Link>
                  </Button>
                </div>
              </form>

              <aside className="space-y-5 lg:sticky lg:top-24 lg:col-span-4">
                <GuidePanel />
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  tone,
}: {
  icon: ReactNode;
  title: string;
  tone: "brass" | "ink" | "green";
}) {
  const toneClass = {
    brass: "border-brushed-brass/20 bg-brushed-brass/10 text-brushed-brass",
    ink: "border-ink-blue/20 bg-ink-blue/10 text-ink-blue",
    green: "border-verdigris/20 bg-verdigris/10 text-verdigris",
  }[tone];

  return (
    <div className="mb-7 flex items-center gap-3 border-b border-[#4e4637]/10 pb-4">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${toneClass}`}
      >
        {icon}
      </div>
      <h2 className="font-serif text-xl font-bold text-ink-blue">{title}</h2>
    </div>
  );
}

function MoneyField({
  id,
  label,
  register,
  error,
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="1 000 000"
          className="h-11 bg-white pr-14 text-base font-semibold tabular-nums text-[#181612] placeholder:text-[#8D877C]/55 focus-visible:bg-white"
          {...register}
          aria-invalid={!!error}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted-warm">
          VND
        </span>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function DateTimeField({
  id,
  label,
  min,
  register,
  error,
}: {
  id: string;
  label: string;
  min?: string;
  register: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="datetime-local" min={min} {...register} aria-invalid={!!error} />
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function PriceHint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-muted-warm">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums text-[#181612]">{value}</p>
    </div>
  );
}

function SelectedProductPreview({ product }: { product: SellerProduct }) {
  return (
    <div className="mt-5 flex items-center gap-4 rounded-lg border border-[#4e4637]/15 bg-[#F6F0E6]/60 p-4">
      <div className="size-14 shrink-0 overflow-hidden rounded-md border border-[#4e4637]/15 bg-white">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-brushed-brass">
            <PackageCheck className="size-6" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink-blue">{product.title}</p>
        <p className="mt-0.5 text-xs text-muted-warm">Mã SP #{product.id}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <ProductStatusBadge status={product.status} />
          <ProductSaleStatusBadge status={product.saleStatus} />
        </div>
      </div>
      <CheckCircle2 className="size-5 shrink-0 text-verdigris" aria-hidden />
    </div>
  );
}

function GuidePanel() {
  return (
    <div className="rounded-xl border border-[#4e4637]/15 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-brushed-brass">
        Điều kiện phiên
      </p>
      <h3 className="mt-1 font-serif text-lg font-bold text-ink-blue">Khớp chính sách backend</h3>
      <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-warm">
        <li className="flex gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verdigris" />
          Chỉ sản phẩm đã kiểm định và còn sẵn sàng mới tạo được phiên.
        </li>
        <li className="flex gap-2">
          <WalletCards className="mt-0.5 size-4 shrink-0 text-brushed-brass" />
          Tiền cọc từ 1.000.000 đ và tối đa 50% giá khởi điểm.
        </li>
        <li className="flex gap-2">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-ink-blue" />
          Phiên bắt đầu sau ít nhất 5 phút, kéo dài từ 1 giờ đến 30 ngày.
        </li>
      </ul>
    </div>
  );
}

function EmptyEligibleProducts() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <section className="w-full max-w-md rounded-xl border border-[#4e4637]/15 bg-white p-8 text-center shadow-sm">
        <PackageCheck className="mx-auto size-11 text-[#8D877C]/50" aria-hidden />
        <h2 className="mt-5 font-serif text-xl font-bold text-ink-blue">
          Chưa có sản phẩm đủ điều kiện
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-warm">
          Cần có sản phẩm đã kiểm định và đang sẵn sàng đấu giá trước khi tạo phiên.
        </p>
        <Button asChild className="mt-6 bg-ink-blue text-white hover:bg-ink-blue/90">
          <Link to={SELLER_PATHS.products}>Xem sản phẩm</Link>
        </Button>
      </section>
    </div>
  );
}

function BlockingState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: "loading" | "warning";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <section className="w-full max-w-md rounded-xl border border-[#4e4637]/15 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-ink-blue/15 bg-ink-blue/5 text-ink-blue">
          {icon === "loading" ? (
            <Loader2 className="size-7 animate-spin" aria-hidden />
          ) : (
            <AlertTriangle className="size-7" aria-hidden />
          )}
        </div>
        <h2 className="mt-5 font-serif text-xl font-bold text-ink-blue">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-warm">{description}</p>
        {actionLabel && onAction && (
          <Button
            type="button"
            onClick={onAction}
            className="mt-6 bg-ink-blue text-white hover:bg-ink-blue/90"
          >
            {actionLabel}
          </Button>
        )}
      </section>
    </div>
  );
}
