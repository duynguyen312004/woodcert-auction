import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Gavel, List, Loader2, PackageSearch } from "lucide-react";

import { useWalletBalance } from "@/features/wallet";
import { BidControlPanel } from "../components/BidControlPanel";
import { BidFeed } from "../components/BidFeed";
import { BiddingTopBar } from "../components/BiddingTopBar";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { EndedOverlay } from "../components/EndedOverlay";
import { LivePriceStage } from "../components/LivePriceStage";
import { ProductPanel } from "../components/ProductPanel";
import { useBiddingRoom } from "../hooks/useBiddingRoom";

export default function BiddingRoomPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const [mobilePanel, setMobilePanel] = useState<"bid" | "product" | "feed">("bid");

  const {
    detail,
    participation,
    bids,
    isLoading,
    isError,
    socketStatus,
    placeBid,
    isPlacingBid,
    register,
    isRegistering,
    withdraw,
    isWithdrawing,
    extensionSeconds,
    outbidAlert,
  } = useBiddingRoom(auctionId ?? "");

  const walletQuery = useWalletBalance();

  if (!auctionId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm font-semibold text-destructive">Mã phiên đấu giá không hợp lệ.</p>
        <button
          onClick={() => navigate("/auctions")}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const walletBalance = walletQuery.data?.availableBalance || 0;

  if (isLoading || walletQuery.isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="text-xs font-medium text-muted-foreground">Đang tải phòng đấu giá...</span>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h2 className="text-base font-bold text-foreground">Không tìm thấy phòng đấu giá</h2>
        <p className="max-w-sm text-xs text-muted-foreground">
          Phiên đấu giá không tồn tại hoặc bạn không có quyền truy cập. Vui lòng kiểm tra lại.
        </p>
        <button
          onClick={() => navigate("/auctions")}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách đấu giá
        </button>
      </div>
    );
  }

  const hasEnded = detail.status !== "WAITING" && detail.status !== "ACTIVE";
  const showOutcome = hasEnded && participation && participation.outcomeCode !== "NONE";
  const mobilePanels = [
    { id: "bid" as const, label: "Đặt giá", icon: Gavel },
    { id: "product" as const, label: "Tác phẩm", icon: PackageSearch },
    { id: "feed" as const, label: "Lịch sử", icon: List },
  ];

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-background lg:h-screen lg:overflow-hidden">
      <BiddingTopBar title={detail.product?.title || "Phòng Đấu Giá"} socketStatus={socketStatus} />
      <ConnectionBanner status={socketStatus} />

      <div className="relative flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <ProductPanel
          detail={detail}
          className={`${mobilePanel === "product" ? "flex" : "hidden"} h-auto w-full border-b border-r-0 lg:flex lg:h-full lg:w-[280px] lg:border-b-0 lg:border-r`}
        />

        <div className="order-first flex flex-1 flex-col overflow-visible bg-muted/5 lg:order-none lg:overflow-hidden">
          <LivePriceStage
            currentPrice={detail.currentPrice}
            endTime={detail.endTime}
            highestBidderMaskedAlias={detail.highestBidderMaskedAlias}
            extensionSeconds={extensionSeconds}
            outbidAlert={outbidAlert}
          />

          <div className="sticky top-0 z-10 border-b bg-background/95 px-3 py-3 lg:hidden">
            <div className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/30 p-1">
              {mobilePanels.map((panel) => {
                const Icon = panel.icon;
                const active = mobilePanel === panel.id;
                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setMobilePanel(panel.id)}
                    className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      active
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    <span>{panel.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <BidFeed
            bids={bids}
            className={`${mobilePanel === "feed" ? "flex" : "hidden"} min-h-[420px] lg:flex lg:min-h-0`}
          />
        </div>

        <BidControlPanel
          detail={detail}
          participation={participation}
          isPlacingBid={isPlacingBid}
          isRegistering={isRegistering}
          isWithdrawing={isWithdrawing}
          onPlaceBid={placeBid}
          onRegister={register}
          onWithdraw={withdraw}
          walletBalance={walletBalance}
          className={`${mobilePanel === "bid" ? "flex" : "hidden"} h-auto w-full border-l-0 border-t lg:flex lg:h-full lg:w-[320px] lg:border-l lg:border-t-0`}
        />

        {showOutcome && (
          <EndedOverlay
            outcomeCode={participation.outcomeCode}
            outcomeMessage={participation.outcomeMessage}
          />
        )}
      </div>
    </div>
  );
}
