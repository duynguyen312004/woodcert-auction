/**
 * Trang đăng ký seller.
 *
 * Người dùng đã đăng nhập dùng trang này để tạo hồ sơ seller. Sau khi tạo xong,
 * hệ thống làm mới query và yêu cầu đăng nhập lại để token có quyền seller.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Gavel, Loader2, ShieldCheck, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import {
  accountApi,
  createSellerProfileSchema,
  PROFILE_QUERY_KEY,
  SELLER_PROFILE_QUERY_KEY,
  type CreateSellerProfilePayload,
  useProfile,
} from "@/features/account";
import { refreshAccessToken } from "@/shared/api/client";
import { isApiError } from "@/shared/api/errors";
import { clearAuthSession } from "@/shared/auth/auth-store";
import { SELLER_PATHS } from "@/shared/constants";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NotificationCard } from "@/shared/ui/notification";

function SuccessState() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <section
        aria-labelledby="success-heading"
        className="w-full max-w-md animate-scale-in rounded-xl border border-border/60 bg-card p-8 text-center shadow-2xl"
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
          <CheckCircle2 className="size-8 text-primary" aria-hidden />
        </div>

        <h1 id="success-heading" className="mt-6 font-serif text-2xl font-bold text-foreground">
          Hồ sơ đã được tạo thành công
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Hồ sơ người bán đã được ghi nhận. Để truy cập Seller Portal, vui lòng đăng nhập lại để làm
          mới phiên với quyền seller.
        </p>

        <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-left text-xs text-amber-300">
          <strong className="font-semibold">Lưu ý:</strong> Phiên đăng nhập hiện tại chưa có quyền
          seller. Đăng nhập lại để kích hoạt đầy đủ quyền truy cập.
        </div>

        <Button
          type="button"
          className="mt-6 w-full text-primary-foreground"
          onClick={() => {
            clearAuthSession();
            window.location.assign("/auth/login");
          }}
        >
          Đăng nhập lại ngay
        </Button>
      </section>
    </div>
  );
}

export function SellerRegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isPending: profileLoading } = useProfile();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCreated, setIsCreated] = useState(false);

  useEffect(() => {
    if (profile?.hasSellerProfile) {
      navigate(SELLER_PATHS.dashboard, { replace: true });
    }
  }, [profile, navigate]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateSellerProfilePayload>({
    resolver: zodResolver(createSellerProfileSchema),
    defaultValues: {
      storeName: "",
      identityCardNumber: "",
      taxCode: "",
    },
  });

  const onSubmit = async (data: CreateSellerProfilePayload) => {
    setSubmitError(null);
    let sellerProfileCreated = false;
    try {
      await accountApi.createSellerProfile(data);
      sellerProfileCreated = true;
      await refreshAccessToken();
      await queryClient.invalidateQueries({ queryKey: SELLER_PROFILE_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      navigate(SELLER_PATHS.dashboard, { replace: true });
    } catch (error: unknown) {
      if (sellerProfileCreated) {
        setIsCreated(true);
        return;
      }
      if (isApiError(error)) {
        for (const field of ["storeName", "identityCardNumber", "taxCode"] as const) {
          const message = error.fieldErrors?.[field];
          if (message) setError(field, { type: "server", message });
        }
        setSubmitError(error.fieldErrors ? null : error.message);
        return;
      }
      setSubmitError("Không thể tạo hồ sơ người bán. Vui lòng thử lại sau.");
    }
  };

  if (isCreated) return <SuccessState />;

  if (profileLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 md:py-24">
      <div className="mx-auto max-w-screen-xl px-6 md:px-12">
        <header className="mb-12 animate-fade-in-up">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Seller Portal</p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Đăng ký thông tin người bán
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Bắt đầu hành trình giới thiệu những kiệt tác gỗ mỹ nghệ của bạn tới cộng đồng sưu tầm
            tinh hoa.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* Form đăng ký */}
          <div className="animate-fade-in-up [animation-delay:0.1s] lg:col-span-8">
            {submitError && (
              <NotificationCard
                tone="error"
                title="Không thể tạo hồ sơ"
                description={submitError}
                className="mb-6"
              />
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
              noValidate
            >
              {/* Phần 1: thông tin gian hàng */}
              <section className="p-8" aria-labelledby="section-store">
                <div className="mb-8 flex items-center gap-3 border-b border-border/40 pb-4">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <Store className="size-4 text-primary" aria-hidden />
                  </div>
                  <h2 id="section-store" className="font-serif text-xl font-bold text-foreground">
                    Thông tin gian hàng
                  </h2>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="storeName">
                    Tên gian hàng{" "}
                    <span className="text-destructive" aria-hidden>
                      *
                    </span>
                  </Label>
                  <Input
                    id="storeName"
                    placeholder="Ví dụ: Nghệ Nhân Gỗ Việt"
                    {...register("storeName")}
                    aria-invalid={!!errors.storeName}
                    aria-describedby={errors.storeName ? "storeName-error" : undefined}
                  />
                  {errors.storeName && (
                    <p id="storeName-error" className="text-sm text-destructive" role="alert">
                      {errors.storeName.message}
                    </p>
                  )}
                </div>
              </section>

              <div className="mx-8 h-px bg-border/30" />

              {/* Phần 2: thông tin pháp lý */}
              <section className="p-8" aria-labelledby="section-legal">
                <div className="mb-8 flex items-center gap-3 border-b border-border/40 pb-4">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-ink-blue/20 bg-ink-blue/10">
                    <Gavel className="size-4 text-ink-blue" aria-hidden />
                  </div>
                  <h2 id="section-legal" className="font-serif text-xl font-bold text-foreground">
                    Thông tin pháp lý
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="identityCardNumber">
                      Số CCCD / CMND{" "}
                      <span className="text-destructive" aria-hidden>
                        *
                      </span>
                    </Label>
                    <Input
                      id="identityCardNumber"
                      inputMode="numeric"
                      placeholder="001xxxxxxxx"
                      {...register("identityCardNumber")}
                      aria-invalid={!!errors.identityCardNumber}
                      aria-describedby={
                        errors.identityCardNumber ? "identityCardNumber-error" : undefined
                      }
                    />
                    {errors.identityCardNumber && (
                      <p
                        id="identityCardNumber-error"
                        className="text-sm text-destructive"
                        role="alert"
                      >
                        {errors.identityCardNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="taxCode">
                      Mã số thuế{" "}
                      <span className="text-xs font-normal text-muted-foreground">(tùy chọn)</span>
                    </Label>
                    <Input
                      id="taxCode"
                      placeholder="0312345678"
                      {...register("taxCode")}
                      aria-invalid={!!errors.taxCode}
                      aria-describedby={errors.taxCode ? "taxCode-error" : undefined}
                    />
                    {errors.taxCode && (
                      <p id="taxCode-error" className="text-sm text-destructive" role="alert">
                        {errors.taxCode.message}
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border-l-4 border-ink-blue/40 bg-ink-blue/5 p-4 md:col-span-2">
                    <p className="text-sm italic text-muted-foreground">
                      Thông tin pháp lý được bảo mật tuyệt đối và chỉ dùng cho mục đích xác thực
                      danh tính người bán trên hệ thống WoodCert.
                    </p>
                  </div>
                </div>
              </section>

              {/* Cam kết và nút gửi */}
              <div className="space-y-6 border-t border-border/30 px-8 pb-8 pt-6">
                <label className="group flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 size-4 rounded-sm border-border/50 accent-primary"
                  />
                  <span className="select-none text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    Tôi cam kết các thông tin cung cấp là đúng sự thật và tuân thủ quy chế đấu giá
                    của WoodCert.
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 text-primary-foreground"
                  >
                    {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    Gửi hồ sơ đăng ký
                  </Button>
                  <Button
                    asChild
                    type="button"
                    variant="outline"
                    className="border-border/60 bg-card text-foreground hover:bg-muted hover:text-foreground active:scale-97 transition-all cursor-pointer"
                  >
                    <Link to="/account">Quay lại hồ sơ</Link>
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar thông tin hỗ trợ */}
          <aside
            className="animate-fade-in-up [animation-delay:0.2s] space-y-6 lg:sticky lg:top-24 lg:col-span-4"
            aria-label="Thông tin người bán"
          >
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/30 px-6 pb-4 pt-6">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
                  Seller Portal
                </p>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Đặc quyền Người bán
                </h3>
              </div>

              <ul className="space-y-6 p-6">
                <li className="flex items-start gap-4">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <ShieldCheck className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
                      Chứng thực giá trị
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Quy trình thẩm định WoodCert giúp nâng tầm giá trị thực cho tác phẩm của bạn.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-verdigris/20 bg-verdigris/10">
                    <Store className="size-4 text-verdigris" aria-hidden />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-verdigris">
                      Mạng lưới cao cấp
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tiếp cận mạng lưới nhà sưu tập và các nhà đấu giá uy tín nhất khu vực.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-ink-blue/20 bg-ink-blue/10">
                    <Gavel className="size-4 text-ink-blue" aria-hidden />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-blue">
                      An toàn &amp; Minh bạch
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Hệ thống thanh toán ký quỹ và quy trình đấu giá minh bạch tuyệt đối.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-ink-blue/20 bg-ink-blue/5 p-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-blue">
                Hỗ trợ
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                Đội ngũ chuyên viên tư vấn luôn sẵn sàng giải đáp thắc mắc về quy trình trở thành
                người bán.
              </p>
              <a
                href="mailto:support@woodcert.vn"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Liên hệ hỗ trợ <span aria-hidden>→</span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
