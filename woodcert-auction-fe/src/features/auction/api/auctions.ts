import { apiRequest } from "@/shared/api/client";
import type { PaginationResponse } from "@/shared/api/types";

import type { ArtAuction, AuctionDetail, AuctionStatus, ConditionGrade } from "../types";

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

type AuctionDetailDto = {
  id: number | string;
  status: AuctionStatus;
  startingPrice: number | string;
  currentPrice: number | string | null;
  stepPrice: number | string;
  depositAmount: number | string;
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
    storeName?: string | null;
    name?: string | null;
    reputationScore?: number | string | null;
  } | null;
  highestBidderMaskedAlias?: string | null;
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

export function mapAuctionDetail(dto: AuctionDetailDto): AuctionDetail {
  return {
    id: toNumber(dto.id),
    status: dto.status,
    startingPrice: toNumber(dto.startingPrice),
    currentPrice: toNumber(dto.currentPrice, toNumber(dto.startingPrice)),
    stepPrice: toNumber(dto.stepPrice),
    depositAmount: toNumber(dto.depositAmount),
    startTime: dto.startTime,
    endTime: dto.endTime,
    product: dto.product
      ? {
          id: dto.product.id,
          title: dto.product.title,
          description: dto.product.description ?? null,
          material: dto.product.material,
          dimensions: dto.product.dimensions ?? null,
          weight: dto.product.weight == null ? null : toNumber(dto.product.weight),
          primaryImage: dto.product.primaryImage || fallbackProductImage,
          imageUrls: dto.product.images || [],
          certificateCode: dto.product.appraisal?.certificateCode ?? null,
          isAuthentic: Boolean(dto.product.appraisal?.isAuthentic),
          appraisal: dto.product.appraisal
            ? {
                certificateCode: dto.product.appraisal.certificateCode ?? null,
                verifiedMaterial: dto.product.appraisal.verifiedMaterial ?? null,
                origin: dto.product.appraisal.origin ?? null,
                ageEstimation: dto.product.appraisal.ageEstimation ?? null,
                conditionGrade: dto.product.appraisal.conditionGrade ?? null,
                estimatedValue:
                  dto.product.appraisal.estimatedValue == null
                    ? null
                    : toNumber(dto.product.appraisal.estimatedValue),
                isAuthentic: Boolean(dto.product.appraisal.isAuthentic),
              }
            : null,
        }
      : null,
    seller: dto.seller
      ? {
          storeName: dto.seller.storeName ?? dto.seller.name ?? "WoodCert Seller",
          reputationScore: toNumber(dto.seller.reputationScore),
        }
      : null,
    highestBidderMaskedAlias: dto.highestBidderMaskedAlias || null,
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

export async function getPublicAuctionDetail(auctionId: string | number): Promise<AuctionDetail> {
  const response = await apiRequest<AuctionDetailDto>({
    method: "GET",
    url: `/auctions/${auctionId}`,
  });

  return mapAuctionDetail(response);
}

export async function getPublicAuctionMaterials(): Promise<string[]> {
  return apiRequest<string[]>({
    method: "GET",
    url: "/auctions/materials",
  });
}
