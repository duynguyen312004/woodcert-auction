/**
 * API và mapper dữ liệu cho khu seller.
 *
 * Các hook dashboard dùng file này để lấy sản phẩm và phiên đấu giá của seller
 * hiện tại. Mapper đổi dữ liệu backend sang dạng gọn hơn cho card và bảng.
 */
import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

import type { ProductStatus, SellerAuction, SellerAuctionStatus, SellerProduct } from "../types";

type SellerProductDto = {
  id: number;
  title: string;
  category?: unknown;
  material: string | null;
  status: ProductStatus;
  primaryImage: string | null;
  createdAt: string;
};

type SellerAuctionDto = {
  id: number;
  productTitle: string | null;
  productId: number;
  status: SellerAuctionStatus;
  startingPrice: number | string;
  depositAmount: number | string;
  startTime: string;
  endTime: string;
  currentPrice: number | string | null;
  participantCount: number;
  createdAt: string;
};

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// API sản phẩm trả DTO backend, còn bảng seller chỉ cần model UI gọn hơn.
function mapSellerProduct(dto: SellerProductDto): SellerProduct {
  return {
    id: dto.id.toString(),
    title: dto.title,
    woodType: dto.material,
    status: dto.status,
    imageUrl: dto.primaryImage,
    createdAt: dto.createdAt,
  };
}

// Card phiên đấu giá chỉ cần dữ liệu tóm tắt, không cần payload chi tiết đầy đủ.
function mapSellerAuction(dto: SellerAuctionDto): SellerAuction {
  return {
    id: dto.id.toString(),
    title: dto.productTitle ?? "Phiên đấu giá",
    status: dto.status,
    currentPrice: toNumber(dto.currentPrice, toNumber(dto.startingPrice)),
    bidCount: dto.participantCount,
    startTime: dto.startTime,
    endTime: dto.endTime,
    imageUrl: null,
  };
}

export const sellerApi = {
  getMyProducts: async (params?: {
    page?: number;
    size?: number;
    status?: string;
  }): Promise<PaginationResponse<SellerProduct>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<SellerProductDto>>>(
      "/products",
      { params },
    );
    const data = unwrapApiResponse(response);
    return {
      ...data,
      result: data.result.map(mapSellerProduct),
    };
  },

  getMyAuctions: async (params?: {
    page?: number;
    size?: number;
    status?: string;
  }): Promise<PaginationResponse<SellerAuction>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<SellerAuctionDto>>>(
      "/auctions/me",
      { params },
    );
    const data = unwrapApiResponse(response);
    return {
      ...data,
      result: data.result.map(mapSellerAuction),
    };
  },
};
