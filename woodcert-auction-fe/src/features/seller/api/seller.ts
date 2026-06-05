/**
 * API và mapper dữ liệu cho khu seller.
 *
 * Các hook dashboard dùng file này để lấy sản phẩm và phiên đấu giá của seller
 * hiện tại. Mapper đổi dữ liệu backend sang dạng gọn hơn cho card và bảng.
 * Các hàm createProduct và submitAppraisal phục vụ form đăng sản phẩm.
 */
import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";
import { fulfillmentApi } from "@/features/fulfillment/api/fulfillmentApi";
import { mapOrder } from "@/features/order";
import type { OrderSummary } from "@/features/order";

import type {
  CreateAuctionSessionPayload,
  CreateProductPayload,
  ProductDetail,
  ProductStatus,
  SellerAuction,
  SellerAuctionDetail,
  SellerAuctionStats,
  SellerAuctionStatus,
  SellerProduct,
  UpdateProductPayload,
} from "../types";

type SellerProductDto = {
  id: number;
  title: string;
  category?: unknown;
  material: string | null;
  status: ProductStatus;
  saleStatus: SellerProduct["saleStatus"];
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
  imageUrl: string | null;
  createdAt: string;
};

type SellerAuctionDetailDto = {
  id: number;
  status: SellerAuctionStatus;
  startingPrice: number | string;
  reservePrice: number | string;
  stepPrice: number | string;
  depositAmount: number | string;
  currentPrice: number | string | null;
  finalPrice: number | string | null;
  startTime: string;
  endTime: string;
  participantCount: number;
  winnerMaskedAlias: string | null;
  settlementStatus: SellerAuctionDetail["settlementStatus"];
  settlement: SellerAuctionDetail["settlement"];
  order: OrderSummary | null;
  product: SellerAuctionDetail["product"];
  createdAt: string;
  updatedAt: string;
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
    saleStatus: dto.saleStatus,
    imageUrl: dto.primaryImage,
    createdAt: dto.createdAt,
  };
}

// Card phiên đấu giá chỉ cần dữ liệu tóm tắt, không cần payload chi tiết đầy đủ.
function mapSellerAuction(dto: SellerAuctionDto): SellerAuction {
  return {
    id: dto.id.toString(),
    title: dto.productTitle ?? "Phiên đấu giá",
    productId: dto.productId.toString(),
    status: dto.status,
    startingPrice: toNumber(dto.startingPrice),
    currentPrice: toNumber(dto.currentPrice, toNumber(dto.startingPrice)),
    depositAmount: toNumber(dto.depositAmount),
    bidCount: dto.participantCount,
    startTime: dto.startTime,
    endTime: dto.endTime,
    imageUrl: dto.imageUrl ?? null,
    createdAt: dto.createdAt,
  };
}

function mapSellerAuctionDetail(dto: SellerAuctionDetailDto): SellerAuctionDetail {
  return {
    id: dto.id.toString(),
    status: dto.status,
    startingPrice: toNumber(dto.startingPrice),
    reservePrice: toNumber(dto.reservePrice),
    stepPrice: toNumber(dto.stepPrice),
    depositAmount: toNumber(dto.depositAmount),
    currentPrice: toNumber(dto.currentPrice, toNumber(dto.startingPrice)),
    finalPrice:
      dto.finalPrice === null || dto.finalPrice === undefined ? null : toNumber(dto.finalPrice),
    startTime: dto.startTime,
    endTime: dto.endTime,
    participantCount: dto.participantCount,
    winnerMaskedAlias: dto.winnerMaskedAlias,
    settlementStatus: dto.settlementStatus,
    settlement: dto.settlement ?? { frozen: 0, refunded: 0, deducted: 0, confiscated: 0 },
    order: mapOrder(dto.order),
    product: dto.product,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export const sellerApi = {
  getMyProducts: async (params?: {
    page?: number;
    size?: number;
    status?: string;
    saleStatus?: string;
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

  getMyAuctionDetail: async (auctionId: number): Promise<SellerAuctionDetail> => {
    const response = await apiClient.get<ApiResponse<SellerAuctionDetailDto>>(
      `/auctions/me/${auctionId}`,
    );
    return mapSellerAuctionDetail(unwrapApiResponse(response));
  },

  getMyAuctionStats: async (): Promise<SellerAuctionStats> => {
    type StatsDto = {
      waiting: number;
      active: number;
      endedSuccess: number;
      endedFailed: number;
      canceled: number;
    };
    const response = await apiClient.get<ApiResponse<StatsDto>>("/auctions/me/stats");
    return unwrapApiResponse(response);
  },

  createProduct: async (payload: CreateProductPayload): Promise<{ id: number }> => {
    const response = await apiClient.post<ApiResponse<{ id: number }>>("/products", payload);
    return unwrapApiResponse(response);
  },

  getProductDetail: async (productId: number): Promise<ProductDetail> => {
    const response = await apiClient.get<ApiResponse<ProductDetail>>(`/products/${productId}`);
    return unwrapApiResponse(response);
  },

  updateProduct: async (
    productId: number,
    payload: UpdateProductPayload,
  ): Promise<ProductDetail> => {
    const response = await apiClient.put<ApiResponse<ProductDetail>>(
      `/products/${productId}`,
      payload,
    );
    return unwrapApiResponse(response);
  },

  submitAppraisal: async (productId: number): Promise<void> => {
    await apiClient.post(`/products/${productId}/submit-appraisal`);
  },

  createAuctionSession: async (payload: CreateAuctionSessionPayload): Promise<{ id: number }> => {
    const response = await apiClient.post<ApiResponse<{ id: number }>>("/auctions", payload);
    return unwrapApiResponse(response);
  },

  cancelAuction: async (auctionId: number): Promise<void> => {
    await apiClient.patch(`/auctions/${auctionId}/cancel`);
  },

  confirmShipping: fulfillmentApi.confirmShipping,
};
