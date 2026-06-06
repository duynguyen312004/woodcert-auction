/**
 * API client cho chức năng Bidding Room.
 *
 * Chứa các hàm gọi REST API như lấy thông tin chi tiết phiên đấu giá, lịch sử bid,
 * trạng thái tham gia ký quỹ, đặt giá và đăng ký đặt cọc.
 */

import { apiRequest } from "@/shared/api/client";
import { getPublicAuctionDetail } from "@/features/auction";
import type { ParticipationStatus, BidHistoryItem, OutcomeCode, PlaceBidResult } from "../types";

// Helper chuyển đổi giá trị từ string/number sang number để đảm bảo an toàn kiểu dữ liệu.
function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

interface ParticipationStatusDto {
  sellerOwned?: boolean;
  registered?: boolean;
  depositStatus?: string | null;
  highestBidder?: boolean;
  canRegister?: boolean;
  canWithdraw?: boolean;
  canBid?: boolean;
  reasonCode?: string;
  reasonMessage?: string;
  depositAmount?: string | number;
  winner?: boolean;
  outcomeCode?: string;
  outcomeMessage?: string;
}

interface BidHistoryItemDto {
  bidTraceId: string;
  bidAmount: string | number;
  bidderMaskedAlias: string;
  bidTime: string;
  mine?: boolean;
}

interface PlaceBidResultDto {
  bidTraceId: string;
  auctionSessionId: string | number;
  currentPrice: string | number;
  endTime: string;
}

// REST endpoints:
// 1. GET /auctions/{id}
export const getBiddingAuctionDetail = getPublicAuctionDetail;

// 2. GET /auctions/{id}/my-participation
export async function getBiddingParticipation(
  auctionId: string | number,
): Promise<ParticipationStatus> {
  const response = await apiRequest<ParticipationStatusDto>({
    method: "GET",
    url: `/auctions/${auctionId}/my-participation`,
    requiresAuth: true,
  });

  return {
    sellerOwned: Boolean(response.sellerOwned),
    registered: Boolean(response.registered),
    depositStatus:
      (response.depositStatus as
        | "FROZEN"
        | "WITHDRAWN"
        | "REFUNDED"
        | "DEDUCTED"
        | "CONFISCATED"
        | null) || null,
    highestBidder: Boolean(response.highestBidder),
    canRegister: Boolean(response.canRegister),
    canWithdraw: Boolean(response.canWithdraw),
    canBid: Boolean(response.canBid),
    reasonCode: response.reasonCode || "",
    reasonMessage: response.reasonMessage || "",
    depositAmount: toNumber(response.depositAmount),
    winner: Boolean(response.winner),
    outcomeCode: (response.outcomeCode as OutcomeCode) || "NONE",
    outcomeMessage: response.outcomeMessage || "",
  };
}

// 3. GET /auctions/{id}/bids
export async function getBiddingHistory(
  auctionId: string | number,
  size = 20,
): Promise<BidHistoryItem[]> {
  const response = await apiRequest<BidHistoryItemDto[]>({
    method: "GET",
    url: `/auctions/${auctionId}/bids`,
    params: { size },
    requiresAuth: true,
  });

  return response.map((item) => ({
    bidTraceId: item.bidTraceId,
    bidAmount: toNumber(item.bidAmount),
    bidderMaskedAlias: item.bidderMaskedAlias,
    bidTime: item.bidTime,
    mine: Boolean(item.mine),
  }));
}

// 4. POST /bids
export async function placeBid(
  auctionSessionId: number,
  bidAmount: number,
): Promise<PlaceBidResult> {
  const response = await apiRequest<PlaceBidResultDto>({
    method: "POST",
    url: "/bids",
    data: {
      auctionSessionId,
      bidAmount,
    },
    requiresAuth: true,
  });

  return {
    bidTraceId: response.bidTraceId,
    auctionSessionId: toNumber(response.auctionSessionId),
    currentPrice: toNumber(response.currentPrice),
    endTime: response.endTime,
  };
}

// 5. POST /auctions/{id}/register
export async function registerAuction(auctionId: string | number): Promise<unknown> {
  return apiRequest<unknown>({
    method: "POST",
    url: `/auctions/${auctionId}/register`,
    requiresAuth: true,
  });
}

// 6. POST /auctions/{id}/withdraw
export async function withdrawAuction(auctionId: string | number): Promise<unknown> {
  return apiRequest<unknown>({
    method: "POST",
    url: `/auctions/${auctionId}/withdraw`,
    requiresAuth: true,
  });
}
