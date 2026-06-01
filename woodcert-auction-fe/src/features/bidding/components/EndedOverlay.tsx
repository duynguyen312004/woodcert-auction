/**
 * EndedOverlay Component.
 *
 * Hiển thị kết quả thắng/thua hoặc trạng thái phiên đấu giá đã kết thúc
 * dưới dạng một overlay tràn màn hình, kèm theo nút CTA quay lại trang danh sách.
 */

import { Trophy, XCircle, Ban, AlertCircle, ArrowLeft, Store } from "lucide-react";
import { useNavigate } from "react-router";
import type { OutcomeCode } from "../types";

interface EndedOverlayProps {
  outcomeCode: OutcomeCode;
  outcomeMessage?: string;
}

export function EndedOverlay({ outcomeCode, outcomeMessage }: EndedOverlayProps) {
  const navigate = useNavigate();

  if (outcomeCode === "NONE") {
    return null;
  }

  const getContent = () => {
    switch (outcomeCode) {
      case "WINNER":
        return {
          icon: <Trophy className="h-16 w-16 text-yellow-500 animate-bounce" />,
          title: "Chúc mừng!",
          description: "Bạn đã thắng phiên đấu giá này.",
          color: "border-yellow-500/20 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400",
        };
      case "LOSER":
        return {
          icon: <XCircle className="h-16 w-16 text-muted-foreground" />,
          title: "Phiên đấu giá đã kết thúc",
          description: "Rất tiếc, bạn đã không giành chiến thắng lần này.",
          color: "border-border bg-muted/30 text-foreground",
        };
      case "ENDED_FAILED":
        return {
          icon: <Ban className="h-16 w-16 text-destructive" />,
          title: "Đấu giá thất bại",
          description: "Phiên đấu giá đã kết thúc nhưng không đạt mức giá sàn.",
          color: "border-destructive/20 bg-destructive/5 text-destructive",
        };
      case "PENDING_SETTLEMENT":
        return {
          icon: <AlertCircle className="h-16 w-16 text-amber-500 animate-pulse" />,
          title: "Đang đối soát kết quả",
          description: "Hệ thống đang tiến hành kiểm tra và hoàn thành các thủ tục ký quỹ.",
          color: "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400",
        };
      case "SELLER_VIEW":
        return {
          icon: <Store className="h-16 w-16 text-primary" />,
          title: "Phiên của bạn đã kết thúc",
          description: "Hệ thống đang tiến hành đối soát và xử lý tài chính cho phiên đấu giá.",
          color: "border-primary/20 bg-primary/5 text-primary",
        };
      case "NOT_PARTICIPATED":
      default:
        return {
          icon: <Ban className="h-16 w-16 text-muted-foreground" />,
          title: "Phiên đấu giá đã kết thúc",
          description: "Bạn đã không đăng ký tham gia phiên đấu giá này.",
          color: "border-border bg-muted/30 text-foreground",
        };
    }
  };

  const content = getContent();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md transition-all duration-500">
      <div
        className={`mx-4 max-w-md w-full rounded-2xl border p-8 text-center shadow-2xl transition-all duration-300 ${content.color}`}
      >
        <div className="mb-6 flex justify-center">{content.icon}</div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">{content.title}</h2>
        <p className="text-sm text-muted-foreground mb-8">
          {outcomeMessage || content.description}
        </p>
        <button
          onClick={() => navigate("/auctions")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity w-full"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách đấu giá
        </button>
      </div>
    </div>
  );
}
