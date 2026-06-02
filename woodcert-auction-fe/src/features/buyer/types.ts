import type { AuctionProductSummary } from "@/features/auction/types";
import type { OrderStatus, OrderSummary } from "@/features/order";

export type BuyerOutcomeCode =
  | "NONE"
  | "PENDING"
  | "ACTIVE"
  | "WINNER"
  | "LOSER"
  | "ENDED_FAILED"
  | "PENDING_SETTLEMENT";

export interface BuyerAuction {
  auctionId: number;
  productTitle: string;
  productImageUrl: string | null;
  status: string;
  currentPrice: number;
  depositAmount: number;
  depositStatus: string;
  outcomeCode: BuyerOutcomeCode;
  orderStatus: OrderStatus | null;
  startTime: string;
  endTime: string;
  registeredAt: string;
}

export interface BuyerAuctionStats {
  total: number;
  active: number;
  won: number;
  lost: number;
  pendingSettlement: number;
}

export interface BuyerAuctionDetail {
  auctionId: number;
  product: AuctionProductSummary;
  status: string;
  startingPrice: number;
  currentPrice: number;
  depositAmount: number;
  depositStatus: string;
  outcomeCode: BuyerOutcomeCode;
  outcomeMessage: string;
  winner: boolean;
  startTime: string;
  endTime: string;
  registeredAt: string;
  highestBidderMaskedAlias: string | null;
  myBidCount: number;
  myHighestBid: number | null;
  order: OrderSummary | null;
}
