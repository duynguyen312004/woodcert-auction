import { apiRequest } from "@/shared/api/client";
import type { PaginationResponse } from "@/shared/api/types";

import type { ArtAuction, AuctionStatus, ConditionGrade } from "../types";

type AuctionListItemDto = {
  id: number;
  product: {
    id: number;
    title: string;
    primaryImage: string | null;
    material: string | null;
    categoryName: string | null;
    conditionGrade: ConditionGrade | null;
    certificateCode: string | null;
    isAuthentic: boolean;
    sellerAccuracy: number | string | null;
  } | null;
  startingPrice: number | string;
  currentPrice: number | string | null;
  depositAmount: number | string;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  totalParticipants: number;
  seller: {
    name: string | null;
    reputationScore: number | string | null;
  } | null;
};

type GetPublicAuctionsParams = {
  page?: number;
  size?: number;
  status?: AuctionStatus;
  material?: string;
  categoryName?: string;
  priceMin?: number;
  priceMax?: number;
};

const fallbackProductImage = "/assets/hero/woodcert-card-fallback.jpg";

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapAuctionListItem(dto: AuctionListItemDto): ArtAuction {
  return {
    id: dto.id.toString(),
    title: dto.product?.title ?? "Tác phẩm gỗ mỹ nghệ",
    status: dto.status,
    startingPrice: toNumber(dto.startingPrice),
    currentPrice: toNumber(dto.currentPrice, toNumber(dto.startingPrice)),
    bidCount: dto.totalParticipants,
    startTime: dto.startTime,
    endTime: dto.endTime,
    imageUrl: dto.product?.primaryImage || fallbackProductImage,
    woodType: dto.product?.material ?? "Chưa xác định",
    conditionGrade: dto.product?.conditionGrade ?? "GOOD",
    categoryName: dto.product?.categoryName ?? "Đồ gỗ mỹ nghệ",
    isAuthentic: Boolean(dto.product?.isAuthentic),
    certificationScore:
      dto.product?.sellerAccuracy !== null && dto.product?.sellerAccuracy !== undefined
        ? toNumber(dto.product.sellerAccuracy)
        : undefined,
    sellerName: dto.seller?.name ?? "WoodCert Seller",
    sellerRating:
      dto.seller?.reputationScore !== null && dto.seller?.reputationScore !== undefined
        ? toNumber(dto.seller.reputationScore)
        : undefined,
  };
}

export async function getPublicAuctions(params: GetPublicAuctionsParams = {}) {
  const response = await apiRequest<PaginationResponse<AuctionListItemDto>>({
    method: "GET",
    url: "/auctions",
    params: {
      page: params.page ?? 1,
      size: params.size ?? 9,
      status: params.status,
      material: params.material || undefined,
      categoryName: params.categoryName || undefined,
      priceMin: params.priceMin ?? undefined,
      priceMax: params.priceMax ?? undefined,
    },
  });

  return {
    ...response,
    result: response.result.map(mapAuctionListItem),
  };
}
