/**
 * BiddingTopBar Component.
 *
 * Thanh công cụ trên cùng của phòng đấu giá, hiển thị nút quay lại, tiêu đề phiên
 * và trạng thái kết nối socket dưới dạng badge chỉ thị màu sắc.
 */

import { ChevronLeft, Radio } from "lucide-react";
import { useNavigate } from "react-router";
import type { ConnectionStatus } from "../hooks/useAuctionSocket";

interface BiddingTopBarProps {
  title: string;
  socketStatus: ConnectionStatus;
}

export function BiddingTopBar({ title, socketStatus }: BiddingTopBarProps) {
  const navigate = useNavigate();

  const getSocketStatusBadge = () => {
    switch (socketStatus) {
      case "connected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Trực tiếp
          </span>
        );
      case "connecting":
      case "reconnecting":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Đang kết nối
          </span>
        );
      case "disconnected":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
            Ngoại tuyến
          </span>
        );
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background hover:bg-muted transition-colors"
          title="Quay lại"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold tracking-tight line-clamp-1 max-w-[300px] md:max-w-[500px]">
            {title}
          </h1>
          <p className="text-[10px] text-muted-foreground">Phòng đấu giá trực tuyến #WoodCert</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground hidden sm:flex">
          <Radio className="h-3.5 w-3.5" />
          <span>WebSocket:</span>
        </div>
        {getSocketStatusBadge()}
      </div>
    </header>
  );
}
