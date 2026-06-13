import { AlertTriangle, CheckCircle2, Loader2, SendHorizonal, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/shared/ui/button";

import { SELLER_PATHS } from "../constants/routes";

type SuccessStateProps = {
  productId: number;
  onSubmitAppraisal: () => void;
  isSubmitting: boolean;
};

type BlockingStateProps = {
  icon: "loading" | "warning";
  title: string;
  description: string;
};

export function SellerProductSuccessState({
  productId,
  onSubmitAppraisal,
  isSubmitting,
}: SuccessStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 sm:p-8">
      <section
        aria-labelledby="success-heading"
        className="w-full max-w-lg animate-fade-in-up overflow-hidden rounded-2xl border border-[#4e4637]/15 bg-white shadow-[0_20px_60px_rgba(41,55,69,0.12)]"
      >
        <div className="px-6 pb-6 pt-8 text-center sm:px-10 sm:pb-8 sm:pt-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-verdigris/20 bg-verdigris/10 shadow-[0_8px_24px_rgba(52,133,113,0.12)]">
            <CheckCircle2 className="size-8 text-verdigris" aria-hidden />
          </div>

          <h2
            id="success-heading"
            className="mt-5 text-balance font-serif text-2xl font-bold tracking-tight text-ink-blue sm:text-3xl"
          >
            Sản phẩm đã được tạo
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-6 text-muted-warm sm:text-base">
            Sản phẩm #{productId} đã được lưu thành công. Gửi yêu cầu kiểm định để bắt đầu quy trình
            thẩm định.
          </p>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-ink-blue/15 bg-ink-blue/5 p-4 text-left">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-ink-blue shadow-sm ring-1 ring-ink-blue/10">
              <ShieldCheck className="size-4.5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-blue">Bước tiếp theo: gửi kiểm định</p>
              <p className="mt-1 text-sm leading-6 text-muted-warm">
                Sau khi gửi, sản phẩm chuyển sang trạng thái{" "}
                <strong className="whitespace-nowrap font-semibold text-ink-blue">
                  Chờ kiểm định
                </strong>{" "}
                và tạm thời không thể chỉnh sửa.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#4e4637]/10 bg-[#f8f6f2] px-6 py-5 sm:px-10 sm:py-6">
          <Button
            type="button"
            onClick={onSubmitAppraisal}
            disabled={isSubmitting}
            className="h-11 w-full gap-2 font-bold shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <SendHorizonal className="size-4" aria-hidden />
            )}
            Gửi kiểm định ngay
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(SELLER_PATHS.products)}
            className="h-11 w-full border-[#4e4637]/20 bg-white font-semibold text-ink-blue hover:border-brushed-brass/40 hover:bg-[#eae1d6]/50 hover:text-ink-blue"
          >
            Để sau, xem danh sách sản phẩm
          </Button>
        </div>
      </section>
    </div>
  );
}

export function SellerProductBlockingState({ icon, title, description }: BlockingStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
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
        {icon === "warning" && (
          <Button asChild className="mt-6 bg-ink-blue text-white hover:bg-ink-blue/90">
            <Link to={SELLER_PATHS.products}>Quay lại danh sách</Link>
          </Button>
        )}
      </section>
    </div>
  );
}
