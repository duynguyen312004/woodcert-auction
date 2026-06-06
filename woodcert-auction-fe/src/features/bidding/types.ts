/**
 * Định nghĩa các kiểu dữ liệu dùng cho phòng đấu giá (Bidding Room).
 *
 * File này chứa các kiểu dữ liệu đại diện cho chi tiết phiên đấu giá,
 * lịch sử đấu giá, trạng thái tham gia ký quỹ và các sự kiện WebSocket.
 */

import type {
  AuctionDetail,
  AuctionProductAppraisal,
  AuctionProductSummary,
  AuctionSellerSummary,
  AuctionStatus,
} from "@/features/auction";

export type BiddingProductSummary = AuctionProductSummary;
export type BiddingProductAppraisal = AuctionProductAppraisal;
export type BiddingSellerSummary = AuctionSellerSummary;
export type BiddingAuctionDetail = AuctionDetail;

export type OutcomeCode =
  | "NONE"
  | "WINNER"
  | "LOSER"
  | "ENDED_FAILED"
  | "NOT_PARTICIPATED"
  | "WITHDRAWN"
  | "PENDING_SETTLEMENT"
  | "SELLER_VIEW";

export interface ParticipationStatus {
  sellerOwned: boolean;
  registered: boolean;
  depositStatus: "FROZEN" | "WITHDRAWN" | "REFUNDED" | "DEDUCTED" | "CONFISCATED" | null;
  highestBidder: boolean;
  canRegister: boolean;
  canWithdraw: boolean;
  canBid: boolean;
  reasonCode: string;
  reasonMessage: string;
  depositAmount: number;
  winner: boolean;
  outcomeCode: OutcomeCode;
  outcomeMessage: string;
}

export interface BidHistoryItem {
  bidTraceId: string;
  bidAmount: number;
  bidderMaskedAlias: string;
  bidTime: string;
  mine: boolean;
}

export interface PlaceBidResult {
  bidTraceId: string;
  auctionSessionId: number;
  currentPrice: number;
  endTime: string;
}

export interface OutbidAlert {
  id: number;
  price: number;
}

export type SocketEventType = "SESSION_ACTIVATED" | "NEW_BID" | "SESSION_ENDED";

export interface BidBroadcastPayload {
  type: SocketEventType;
  auctionSessionId: number;
  status: AuctionStatus;
  currentPrice: string | number;
  highestBidderMaskedAlias?: string | null;
  endTime: string;
  bidTraceId?: string;
  bidAmount?: string | number;
  bidTime?: string;
  extendedBySeconds?: number | null;
}

export interface NewBidPayload {
  auctionId: number;
  currentPrice: number;
  endTime: string;
  highestBidderMaskedAlias: string | null;
  bidHistoryItem: BidHistoryItem;
  extendedBySeconds?: number;
}

export interface SessionEndedPayload {
  auctionId: number;
  status: AuctionStatus;
}

export interface SocketEvent {
  type: SocketEventType;
  payload: NewBidPayload | SessionEndedPayload;
}
