import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";
import { fulfillmentApi } from "@/features/fulfillment/api/fulfillmentApi";
import { mapOrder, orderApi } from "@/features/order";

import type { BuyerAuction, BuyerAuctionDetail, BuyerAuctionStats } from "../types";

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapAuction(dto: BuyerAuction): BuyerAuction {
  return {
    ...dto,
    currentPrice: toNumber(dto.currentPrice),
    depositAmount: toNumber(dto.depositAmount),
  };
}

function mapDetail(dto: BuyerAuctionDetail): BuyerAuctionDetail {
  return {
    ...dto,
    startingPrice: toNumber(dto.startingPrice),
    currentPrice: toNumber(dto.currentPrice),
    depositAmount: toNumber(dto.depositAmount),
    myHighestBid: dto.myHighestBid == null ? null : toNumber(dto.myHighestBid),
    order: mapOrder(dto.order),
  };
}

export const buyerAuctionApi = {
  getMyAuctions: async (params?: {
    page?: number;
    size?: number;
    outcome?: string;
  }): Promise<PaginationResponse<BuyerAuction>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<BuyerAuction>>>(
      "/auctions/my-participations",
      { params },
    );
    const data = unwrapApiResponse(response);
    return { ...data, result: data.result.map(mapAuction) };
  },

  getStats: async (): Promise<BuyerAuctionStats> => {
    const response = await apiClient.get<ApiResponse<BuyerAuctionStats>>(
      "/auctions/my-participations/stats",
    );
    return unwrapApiResponse(response);
  },

  getDetail: async (auctionId: number): Promise<BuyerAuctionDetail> => {
    const response = await apiClient.get<ApiResponse<BuyerAuctionDetail>>(
      `/auctions/my-participations/${auctionId}`,
    );
    return mapDetail(unwrapApiResponse(response));
  },

  payRemainder: orderApi.payRemainder,

  confirmReceived: fulfillmentApi.confirmReceived,
};
