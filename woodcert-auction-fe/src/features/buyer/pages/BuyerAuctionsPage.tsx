import { CalendarClock, Gavel, PackageSearch, RefreshCw, Trophy, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { BUYER_PATHS } from "@/shared/constants/routes";
import { formatDateTime, formatVND } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { useBuyerAuctions, useBuyerAuctionStats } from "../hooks/useBuyerAuctions";
import type { BuyerAuction } from "../types";

const FILTERS = [
  { id: "ALL", label: "Tất cả" },
  { id: "ACTIVE", label: "Đang diễn ra" },
  { id: "WON", label: "Đã thắng" },
  { id: "LOST", label: "Đã thua" },
  { id: "PENDING", label: "Chờ đối soát" },
] as const;

export function BuyerAuctionsPage() {
  const [outcome, setOutcome] = useState("ALL");
  const auctionsQuery = useBuyerAuctions({ outcome, size: 20 });
  const statsQuery = useBuyerAuctionStats();
  const auctions = auctionsQuery.data?.result ?? [];
  const stats = statsQuery.data;

  const statItems = useMemo(
    () => [
      ["Tổng", stats?.total ?? 0],
      ["Đang diễn ra", stats?.active ?? 0],
      ["Đã thắng", stats?.won ?? 0],
      ["Đã thua", stats?.lost ?? 0],
      ["Chờ đối soát", stats?.pendingSettlement ?? 0],
    ],
    [stats],
  );

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary font-sans">
              Buyer
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight font-sans">Đấu giá của tôi</h1>
          </div>
          <Button type="button" variant="outline" onClick={() => void auctionsQuery.refetch()}>
            <RefreshCw className={cn("h-4 w-4", auctionsQuery.isFetching && "animate-spin")} />
            Làm mới
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-5">
          {statItems.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-stone-200 bg-[#f2eee5] p-4 text-stone-950 shadow-sm transition-all hover:shadow-md hover:border-[#d6a84f]/40"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8d877c] font-sans">
                {label}
              </p>
              <p className="mt-2 text-3xl font-extrabold tabular-nums font-sans text-stone-900">
                {value}
              </p>
            </div>
          ))}
        </section>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setOutcome(filter.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 font-sans cursor-pointer",
                outcome === filter.id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-stone-300 bg-[#f2eee5] text-stone-700 hover:border-stone-550 hover:bg-[#e9e2d6]",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {auctionsQuery.isPending ? (
          <StateCard title="Đang tải danh sách đấu giá" />
        ) : auctions.length === 0 ? (
          <StateCard
            title="Bạn chưa tham gia phiên nào"
            action={
              <Button asChild className="bg-primary text-primary-foreground">
                <Link to="/auctions">Khám phá đấu giá</Link>
              </Button>
            }
          />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {auctions.map((auction) => (
              <BuyerAuctionCard key={auction.auctionId} auction={auction} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function BuyerAuctionCard({ auction }: { auction: BuyerAuction }) {
  const isActive = auction.outcomeCode === "ACTIVE" || auction.status === "ACTIVE";

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-[#f2eee5] text-stone-950 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#d6a84f]/40">
      <Link to={BUYER_PATHS.auctionDetail(auction.auctionId)} className="flex flex-col flex-1">
        <div className="relative aspect-[16/10] bg-stone-200 overflow-hidden">
          {auction.productImageUrl ? (
            <img
              src={auction.productImageUrl}
              alt={auction.productTitle}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              <PackageSearch className="h-10 w-10" />
            </div>
          )}
          <div className="absolute top-3 right-3 z-10">
            <OutcomeBadge code={auction.outcomeCode} />
          </div>
        </div>
        <div className="flex flex-col flex-1 p-5 justify-between gap-4">
          <div>
            <h2 className="line-clamp-2 text-base font-bold text-stone-900 font-sans leading-snug group-hover:text-[#d6a84f] transition-colors">
              {auction.productTitle}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <Metric icon={<Gavel />} label="Giá hiện tại" value={formatVND(auction.currentPrice)} />
            <Metric icon={<Trophy />} label="Cọc" value={formatVND(auction.depositAmount)} />
            <Metric
              icon={<CalendarClock />}
              label="Kết thúc"
              value={formatDateTime(auction.endTime)}
            />
            <Metric
              icon={<Receipt />}
              label="Đơn"
              value={getOrderStatusLabel(auction.orderStatus)}
            />
          </div>
        </div>
      </Link>

      {isActive && (
        <div className="px-5 pb-5 pt-0">
          <Button
            asChild
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold h-9 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Link to={`/bidding/${auction.auctionId}`}>
              <Gavel className="h-3.5 w-3.5" />
              Vào phòng đấu giá
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function getOrderStatusLabel(status: string | null | undefined) {
  if (!status) return "—";
  return (
    {
      PENDING_PAYMENT: "Chờ thanh toán",
      PAID: "Đã thanh toán",
      FULFILLING: "Đang giao",
      COMPLETED: "Hoàn tất",
      CANCELED: "Đã hủy",
      DISPUTED: "Tranh chấp",
    }[status] ?? status
  );
}

function OutcomeBadge({ code }: { code: BuyerAuction["outcomeCode"] }) {
  const label =
    {
      WINNER: "Thắng",
      LOSER: "Thua",
      ACTIVE: "Đang diễn ra",
      PENDING: "Chờ mở",
      PENDING_SETTLEMENT: "Đối soát",
      ENDED_FAILED: "Không đạt sàn",
      NONE: "—",
    }[code] ?? code;

  const styleClass =
    {
      WINNER: "bg-[#2f7d68] text-white border border-[#2f7d68]/30",
      LOSER: "bg-[#8d877c] text-white border border-[#8d877c]/30",
      ACTIVE: "bg-[#d6a84f] text-stone-950 border border-[#d6a84f]/30",
      PENDING: "bg-[#2e4a62] text-white border border-[#2e4a62]/30",
      PENDING_SETTLEMENT: "bg-[#2e4a62] text-white border border-[#2e4a62]/30",
      ENDED_FAILED: "bg-[#b5533e] text-white border border-[#b5533e]/30",
      NONE: "bg-stone-300 text-stone-700 border border-stone-400/20",
    }[code] ?? "bg-stone-950 text-white";

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold font-sans shadow-md backdrop-blur-sm whitespace-nowrap",
        styleClass,
      )}
    >
      {label}
    </span>
  );
}

function Metric({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-300 bg-[#e9e2d6] p-2.5 transition-colors hover:bg-[#e2dacb] font-sans">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8d877c]">
        {icon && <span className="text-stone-500 [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-stone-800 tabular-nums">{value}</p>
    </div>
  );
}

function StateCard({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <section className="flex min-h-[340px] items-center justify-center rounded-lg border border-white/10 bg-[#f2eee5] p-8 text-center text-stone-950">
      <div>
        <PackageSearch className="mx-auto h-10 w-10 text-stone-400" />
        <p className="mt-4 font-bold">{title}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </section>
  );
}
