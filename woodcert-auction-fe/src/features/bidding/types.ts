/**
 * Định nghĩa các kiểu dữ liệu dùng cho phòng đấu giá (Bidding Room).
 *
 * File này chứa các kiểu dữ liệu đại diện cho chi tiết phiên đấu giá,
 * lịch sử đấu giá, trạng thái tham gia ký quỹ và các sự kiện WebSocket.
 */

import type { AuctionStatus } from "@/features/auction";

export interface BiddingProductSummary {
  id: number;
  title: string;
  description: string | null;
  material: string | null;
  dimensions: string | null;
  weight: number | null;
  primaryImage: string | null;
  imageUrls: string[];
  certificateCode: string | null;
  isAuthentic: boolean;
  appraisal: BiddingProductAppraisal | null;
}

export interface BiddingProductAppraisal {
  certificateCode: string | null;
  verifiedMaterial: string | null;
  origin: string | null;
  ageEstimation: string | null;
  conditionGrade: string | null;
  estimatedValue: number | null;
  isAuthentic: boolean;
}

export interface BiddingSellerSummary {
  storeName: string;
  reputationScore: number;
}

export interface BiddingAuctionDetail {
  id: number;
  status: AuctionStatus;
  startingPrice: number;
  currentPrice: number;
  stepPrice: number;
  depositAmount: number;
  startTime: string;
  endTime: string;
  product: BiddingProductSummary | null;
  seller: BiddingSellerSummary | null;
  highestBidderMaskedAlias: string | null;
}

export type OutcomeCode =
  | "NONE"
  | "WINNER"
  | "LOSER"
  | "ENDED_FAILED"
  | "NOT_PARTICIPATED"
  | "PENDING_SETTLEMENT"
  | "SELLER_VIEW";

export interface ParticipationStatus {
  sellerOwned: boolean;
  registered: boolean;
  depositStatus: "FROZEN" | "REFUNDED" | "DEDUCTED" | "CONFISCATED" | null;
  highestBidder: boolean;
  canRegister: boolean;
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
