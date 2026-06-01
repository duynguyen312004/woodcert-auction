/**
 * API client cho chức năng Bidding Room.
 *
 * Chứa các hàm gọi REST API như lấy thông tin chi tiết phiên đấu giá, lịch sử bid,
 * trạng thái tham gia ký quỹ, đặt giá và đăng ký đặt cọc.
 */

import { apiRequest } from "@/shared/api/client";
import type { AuctionStatus } from "@/features/auction";
import type {
  BiddingAuctionDetail,
  ParticipationStatus,
  BidHistoryItem,
  OutcomeCode,
  PlaceBidResult,
} from "../types";

// Helper chuyển đổi giá trị từ string/number sang number để đảm bảo an toàn kiểu dữ liệu.
function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

interface AuctionDetailDto {
  id: string;
  status: string;
  startingPrice: string | number;
  currentPrice: string | number | null;
  stepPrice: string | number;
  depositAmount: string | number;
  startTime: string;
  endTime: string;
  product: {
    id: number;
    title: string;
    description?: string | null;
    material: string | null;
    dimensions?: string | null;
    weight?: number | string | null;
    primaryImage?: string | null;
    images?: string[];
    appraisal?: {
      certificateCode?: string | null;
      verifiedMaterial?: string | null;
      origin?: string | null;
      ageEstimation?: string | null;
      conditionGrade?: string | null;
      estimatedValue?: number | string | null;
      isAuthentic?: boolean;
    } | null;
  } | null;
  seller: {
    storeName: string | null;
    reputationScore?: number | string | null;
  } | null;
  highestBidderMaskedAlias?: string | null;
}

interface ParticipationStatusDto {
  sellerOwned?: boolean;
  registered?: boolean;
  depositStatus?: string | null;
  highestBidder?: boolean;
  canRegister?: boolean;
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
export async function getBiddingAuctionDetail(
  auctionId: string | number,
): Promise<BiddingAuctionDetail> {
  const response = await apiRequest<AuctionDetailDto>({
    method: "GET",
    url: `/auctions/${auctionId}`,
    requiresAuth: true,
  });

  return {
    id: toNumber(response.id),
    status: response.status as AuctionStatus,
    startingPrice: toNumber(response.startingPrice),
    currentPrice: toNumber(response.currentPrice, toNumber(response.startingPrice)),
    stepPrice: toNumber(response.stepPrice),
    depositAmount: toNumber(response.depositAmount),
    startTime: response.startTime,
    endTime: response.endTime,
    product: response.product
      ? {
          id: response.product.id,
          title: response.product.title,
          description: response.product.description ?? null,
          material: response.product.material,
          dimensions: response.product.dimensions ?? null,
          weight: response.product.weight == null ? null : toNumber(response.product.weight),
          primaryImage: response.product.primaryImage ?? "",
          imageUrls: response.product.images || [],
          certificateCode: response.product.appraisal?.certificateCode ?? null,
          isAuthentic: Boolean(response.product.appraisal?.isAuthentic),
          appraisal: response.product.appraisal
            ? {
                certificateCode: response.product.appraisal.certificateCode ?? null,
                verifiedMaterial: response.product.appraisal.verifiedMaterial ?? null,
                origin: response.product.appraisal.origin ?? null,
                ageEstimation: response.product.appraisal.ageEstimation ?? null,
                conditionGrade: response.product.appraisal.conditionGrade ?? null,
                estimatedValue:
                  response.product.appraisal.estimatedValue == null
                    ? null
                    : toNumber(response.product.appraisal.estimatedValue),
                isAuthentic: Boolean(response.product.appraisal.isAuthentic),
              }
            : null,
        }
      : null,
    seller: response.seller
      ? {
          storeName: response.seller.storeName ?? "WoodCert Seller",
          reputationScore: toNumber(response.seller.reputationScore),
        }
      : null,
    highestBidderMaskedAlias: response.highestBidderMaskedAlias || null,
  };
}

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
      (response.depositStatus as "FROZEN" | "REFUNDED" | "DEDUCTED" | "CONFISCATED" | null) || null,
    highestBidder: Boolean(response.highestBidder),
    canRegister: Boolean(response.canRegister),
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
