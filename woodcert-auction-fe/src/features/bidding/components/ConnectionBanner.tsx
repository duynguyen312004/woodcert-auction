/**
 * ConnectionBanner Component.
 *
 * Hiển thị một banner cảnh báo khi kết nối WebSocket với server bị gián đoạn
 * (đang kết nối lại hoặc đã ngắt kết nối hoàn toàn).
 */

import { WifiOff, Loader2 } from "lucide-react";
import type { ConnectionStatus } from "../hooks/useAuctionSocket";

interface ConnectionBannerProps {
  status: ConnectionStatus;
}

export function ConnectionBanner({ status }: ConnectionBannerProps) {
  if (status === "connected") {
    return null;
  }

  const getBannerConfig = () => {
    switch (status) {
      case "connecting":
        return {
          bg: "bg-blue-500/10 border-blue-500/20 text-blue-500",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          message: "Đang thiết lập kết nối realtime...",
        };
      case "reconnecting":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          message: "Mất kết nối mạng. Đang tự động kết nối lại...",
        };
      case "disconnected":
      default:
        return {
          bg: "bg-destructive/10 border-destructive/20 text-destructive",
          icon: <WifiOff className="h-4 w-4" />,
          message: "Đã mất kết nối với phòng đấu giá. Vui lòng tải lại trang.",
        };
    }
  };

  const config = getBannerConfig();

  return (
    <div
      className={`flex items-center justify-center gap-2 border-b py-2 px-4 text-xs font-medium transition-all duration-300 ${config.bg}`}
    >
      {config.icon}
      <span>{config.message}</span>
    </div>
  );
}
