/**
 * Full-screen result summary shown after an auction ends.
 *
 * The API outcome message is intentionally not rendered here because it can be
 * technical or use a different language. User-facing copy is derived from the
 * stable outcome code instead.
 */

import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CircleDollarSign,
  Clock3,
  Gavel,
  ShieldCheck,
  Store,
  Trophy,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";
import { FALLBACK_PRODUCT_IMAGE } from "@/shared/constants";
import { BUYER_PATHS, SELLER_PATHS } from "@/shared/constants/routes";
import { formatVND } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import type { OutcomeCode } from "../types";

interface EndedOverlayProps {
  outcomeCode: OutcomeCode;
  auctionId?: number;
  productTitle?: string | null;
  productImageUrl?: string | null;
  finalPrice?: number;
  depositAmount?: number;
}

interface OutcomePresentation {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  statusLabel: string;
  nextStep: string;
  primaryLabel: string;
  primaryPath: string;
  secondaryLabel: string;
  secondaryPath: string;
  accentClassName: string;
  iconClassName: string;
  iconSurfaceClassName: string;
}

function getOutcomePresentation(
  outcomeCode: Exclude<OutcomeCode, "NONE">,
  auctionId?: number,
): OutcomePresentation {
  const buyerAuctionPath = auctionId ? BUYER_PATHS.auctionDetail(auctionId) : BUYER_PATHS.auctions;
  const sellerAuctionPath = auctionId
    ? SELLER_PATHS.auctionDetail(auctionId)
    : SELLER_PATHS.auctions;

  switch (outcomeCode) {
    case "WINNER":
      return {
        icon: Trophy,
        eyebrow: "Kết quả đấu giá",
        title: "Bạn đã thắng phiên đấu giá",
        description:
          "Tác phẩm đã được ghi nhận cho bạn. Hãy kiểm tra thông tin và hoàn tất thanh toán còn lại đúng thời hạn.",
        statusLabel: "Chiến thắng",
        nextStep: "Tiếp tục đến chi tiết phiên để theo dõi đối soát, thanh toán và đơn hàng.",
        primaryLabel: "Xem chi tiết và thanh toán",
        primaryPath: buyerAuctionPath,
        secondaryLabel: "Đấu giá của tôi",
        secondaryPath: BUYER_PATHS.auctions,
        accentClassName: "border-[#d4a941]/[0.45] bg-[#d4a941]/[0.12] text-[#f0c65d]",
        iconClassName: "text-[#f0c65d]",
        iconSurfaceClassName: "border-[#d4a941]/[0.35] bg-[#d4a941]/[0.12]",
      };
    case "LOSER":
      return {
        icon: XCircle,
        eyebrow: "Kết quả đấu giá",
        title: "Phiên đấu giá đã khép lại",
        description:
          "Bạn chưa giành được tác phẩm lần này. Tiền đặt cọc sẽ được hoàn theo kết quả đối soát của phiên.",
        statusLabel: "Chưa chiến thắng",
        nextStep: "Bạn có thể xem các phiên đang mở và tiếp tục với một tác phẩm phù hợp khác.",
        primaryLabel: "Khám phá phiên khác",
        primaryPath: "/auctions",
        secondaryLabel: "Xem lịch sử đấu giá",
        secondaryPath: BUYER_PATHS.auctions,
        accentClassName: "border-white/15 bg-white/[0.07] text-white/75",
        iconClassName: "text-white/70",
        iconSurfaceClassName: "border-white/15 bg-white/[0.06]",
      };
    case "ENDED_FAILED":
      return {
        icon: Ban,
        eyebrow: "Trạng thái phiên",
        title: "Phiên đấu giá không thành công",
        description:
          "Phiên đã kết thúc nhưng chưa đủ điều kiện xác lập người thắng. Tiền đặt cọc sẽ được xử lý theo quy định.",
        statusLabel: "Không thành công",
        nextStep: "Bạn có thể theo dõi lịch sử phiên hoặc tìm một tác phẩm khác đang mở đấu giá.",
        primaryLabel: "Khám phá phiên khác",
        primaryPath: "/auctions",
        secondaryLabel: "Xem lịch sử đấu giá",
        secondaryPath: BUYER_PATHS.auctions,
        accentClassName: "border-[#c87857]/40 bg-[#c87857]/10 text-[#e9a180]",
        iconClassName: "text-[#e9a180]",
        iconSurfaceClassName: "border-[#c87857]/35 bg-[#c87857]/10",
      };
    case "PENDING_SETTLEMENT":
      return {
        icon: Clock3,
        eyebrow: "Trạng thái phiên",
        title: "Đang đối soát kết quả",
        description:
          "Hệ thống đang xác nhận người thắng và các khoản thanh toán của phiên đấu giá.",
        statusLabel: "Đang xử lý",
        nextStep:
          "Kết quả chính thức sẽ được cập nhật trong chi tiết phiên sau khi đối soát hoàn tất.",
        primaryLabel: "Theo dõi kết quả",
        primaryPath: buyerAuctionPath,
        secondaryLabel: "Đấu giá của tôi",
        secondaryPath: BUYER_PATHS.auctions,
        accentClassName: "border-[#c99a4b]/40 bg-[#c99a4b]/10 text-[#e5bb6b]",
        iconClassName: "text-[#e5bb6b]",
        iconSurfaceClassName: "border-[#c99a4b]/35 bg-[#c99a4b]/10",
      };
    case "SELLER_VIEW":
      return {
        icon: Store,
        eyebrow: "Phiên của gian hàng",
        title: "Phiên đấu giá đã kết thúc",
        description:
          "Phiên đấu giá của bạn đã khép lại. Kết quả và tiến trình đối soát đang được cập nhật.",
        statusLabel: "Đã kết thúc",
        nextStep: "Mở trang quản lý phiên để xem người thắng, giao dịch và các bước cần xử lý.",
        primaryLabel: "Quản lý phiên đấu giá",
        primaryPath: sellerAuctionPath,
        secondaryLabel: "Về danh sách phiên",
        secondaryPath: SELLER_PATHS.auctions,
        accentClassName: "border-[#4f8d7a]/40 bg-[#4f8d7a]/[0.12] text-[#81bba9]",
        iconClassName: "text-[#81bba9]",
        iconSurfaceClassName: "border-[#4f8d7a]/35 bg-[#4f8d7a]/[0.12]",
      };
    case "WITHDRAWN":
      return {
        icon: ArrowLeft,
        eyebrow: "Trạng thái tham gia",
        title: "Bạn đã rút khỏi phiên đấu giá",
        description:
          "Yêu cầu rút khỏi phiên đã được ghi nhận. Tiền đặt cọc sẽ được hoàn theo trạng thái đối soát.",
        statusLabel: "Đã rút khỏi phiên",
        nextStep: "Bạn vẫn có thể khám phá và đăng ký tham gia những phiên đấu giá đang mở khác.",
        primaryLabel: "Khám phá phiên khác",
        primaryPath: "/auctions",
        secondaryLabel: "Xem lịch sử đấu giá",
        secondaryPath: BUYER_PATHS.auctions,
        accentClassName: "border-white/15 bg-white/[0.07] text-white/75",
        iconClassName: "text-white/70",
        iconSurfaceClassName: "border-white/15 bg-white/[0.06]",
      };
    case "NOT_PARTICIPATED":
    default:
      return {
        icon: Gavel,
        eyebrow: "Trạng thái phiên",
        title: "Phiên đấu giá đã kết thúc",
        description:
          "Bạn không tham gia phiên đấu giá này. Kết quả phiên đã được lưu trong hệ thống.",
        statusLabel: "Không tham gia",
        nextStep: "Xem danh sách các phiên đang mở để lựa chọn tác phẩm phù hợp với bạn.",
        primaryLabel: "Xem phiên đang mở",
        primaryPath: "/auctions",
        secondaryLabel: "Quay lại danh sách",
        secondaryPath: BUYER_PATHS.auctions,
        accentClassName: "border-white/15 bg-white/[0.07] text-white/75",
        iconClassName: "text-white/70",
        iconSurfaceClassName: "border-white/15 bg-white/[0.06]",
      };
  }
}

export function EndedOverlay({
  outcomeCode,
  auctionId,
  productTitle,
  productImageUrl,
  finalPrice,
  depositAmount,
}: EndedOverlayProps) {
  if (outcomeCode === "NONE") {
    return null;
  }

  const content = getOutcomePresentation(outcomeCode, auctionId);
  const Icon = content.icon;
  const resultTitleId = `auction-result-${outcomeCode.toLowerCase()}`;

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-[#11130f]/[0.96] backdrop-blur-xl transition-all duration-500">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#b88a38]/[0.08] blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[#376f61]/[0.08] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative flex min-h-full items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={resultTitleId}
          className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#191b17] text-white shadow-[0_32px_100px_rgba(0,0,0,.5)]"
        >
          <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
            <div className="relative min-h-72 overflow-hidden border-b border-white/10 lg:min-h-[590px] lg:border-b-0 lg:border-r">
              <img
                src={productImageUrl || FALLBACK_PRODUCT_IMAGE}
                alt={productTitle || "Tác phẩm đấu giá"}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10120f] via-[#10120f]/35 to-transparent" />

              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5 sm:p-7">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] backdrop-blur-md ${content.accentClassName}`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {content.statusLabel}
                </span>
                {auctionId ? (
                  <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-white/75 backdrop-blur-md">
                    Phiên #{auctionId}
                  </span>
                ) : null}
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                  Tác phẩm đấu giá
                </p>
                <h3 className="max-w-md font-serif text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  {productTitle || "Tác phẩm đã kết thúc đấu giá"}
                </h3>
              </div>
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
              <div
                className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border ${content.iconSurfaceClassName}`}
              >
                <Icon className={`h-8 w-8 ${content.iconClassName}`} strokeWidth={1.8} />
              </div>

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#cda95c]">
                {content.eyebrow}
              </p>
              <h2
                id={resultTitleId}
                className="max-w-xl font-serif text-3xl font-semibold leading-[1.12] text-white sm:text-4xl"
              >
                {content.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                {content.description}
              </p>

              <div className="my-8 grid grid-cols-2 border-y border-white/10">
                <div className="border-r border-white/10 py-5 pr-4">
                  <div className="mb-2 flex items-center gap-2 text-white/45">
                    <CircleDollarSign className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
                      Giá chốt phiên
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-white sm:text-xl">
                    {typeof finalPrice === "number" ? formatVND(finalPrice) : "Đang cập nhật"}
                  </p>
                </div>
                <div className="py-5 pl-4 sm:pl-6">
                  <div className="mb-2 flex items-center gap-2 text-white/45">
                    <WalletCards className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
                      Tiền đặt cọc
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-white sm:text-xl">
                    {typeof depositAmount === "number" ? formatVND(depositAmount) : "Đang cập nhật"}
                  </p>
                </div>
              </div>

              <div className="mb-8 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-4 sm:p-5">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#cda95c]/[0.12] text-[#dfba68]">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Bước tiếp theo</p>
                    <p className="mt-1 text-sm leading-6 text-white/60">{content.nextStep}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-12 flex-1 rounded-xl bg-[#d5ad55] font-semibold text-[#181914] hover:bg-[#e4bd66]"
                >
                  <Link to={content.primaryPath}>
                    {content.primaryLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 flex-1 rounded-xl border-white/15 bg-transparent font-semibold text-white hover:bg-white/[0.07] hover:text-white"
                >
                  <Link to={content.secondaryPath}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {content.secondaryLabel}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
