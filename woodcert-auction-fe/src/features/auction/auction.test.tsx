import {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { useAuthStore } from "@/shared/auth/auth-store";
import { FALLBACK_PRODUCT_IMAGE } from "@/shared/constants";
import { getPublicAuctionDetail, mapAuctionDetail } from "./api/auctions";
import { auctionRoutes } from "./routes";
import { AuctionDetailPage } from "./pages/AuctionDetailPage";

function createResponse<T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T,
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status >= 400 ? "Error" : "OK",
    headers: new AxiosHeaders(),
    config,
  };
}

function createApiResponse<T>(data: T, statusCode = 200): ApiResponse<T> {
  return {
    statusCode,
    message: statusCode >= 400 ? "Error" : "OK",
    data,
    timestamp: "2026-06-01T00:00:00Z",
  };
}

function auctionDetailDto(
  overrides: Partial<Parameters<typeof mapAuctionDetail>[0]> = {},
): Parameters<typeof mapAuctionDetail>[0] {
  return {
    id: 501,
    status: "ACTIVE",
    startingPrice: "10000000",
    currentPrice: "12000000",
    stepPrice: "500000",
    depositAmount: "1000000",
    startTime: "2026-06-01T01:00:00Z",
    endTime: "2026-06-01T02:00:00Z",
    product: {
      id: 101,
      title: "Tượng gỗ trắc",
      material: "Gỗ trắc",
      description: "Tác phẩm đã được thẩm định.",
      dimensions: "40 x 30 x 80 cm",
      weight: "12.5",
      primaryImage: "https://cdn.example/primary.jpg",
      images: ["https://cdn.example/primary.jpg", "https://cdn.example/side.jpg"],
      appraisal: {
        certificateCode: "CERT-501",
        verifiedMaterial: "Gỗ trắc",
        origin: "Việt Nam",
        ageEstimation: "20 năm",
        conditionGrade: "GOOD",
        estimatedValue: "15000000",
        isAuthentic: true,
      },
    },
    seller: {
      storeName: "WoodCert Studio",
      reputationScore: "4.8",
    },
    highestBidderMaskedAlias: "abcd****",
    ...overrides,
  };
}

function renderDetailPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/auctions/501"]}>
        <Routes>
          <Route path="/auctions/:auctionId" element={<AuctionDetailPage />} />
          <Route path="/auth/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("auctionApi", () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    cleanup();
  });

  it("fetches public auction detail without requiring auth", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/auctions/501");
      expect(config.requiresAuth).toBeUndefined();

      return createResponse(config, 200, createApiResponse(auctionDetailDto()));
    };
    apiClient.defaults.adapter = adapter;

    await expect(getPublicAuctionDetail(501)).resolves.toMatchObject({
      id: 501,
      currentPrice: 12000000,
      product: {
        title: "Tượng gỗ trắc",
        imageUrls: ["https://cdn.example/primary.jpg", "https://cdn.example/side.jpg"],
        appraisal: {
          estimatedValue: 15000000,
          isAuthentic: true,
        },
      },
    });
  });

  it("maps nullable detail fields to safe UI defaults", () => {
    expect(
      mapAuctionDetail(
        auctionDetailDto({
          currentPrice: null,
          product: null,
          seller: null,
          highestBidderMaskedAlias: null,
        }),
      ),
    ).toMatchObject({
      currentPrice: 10000000,
      product: null,
      seller: null,
      highestBidderMaskedAlias: null,
    });
  });

  it("uses the shared fallback product image when backend omits primary image", () => {
    const mapped = mapAuctionDetail(
      auctionDetailDto({
        product: {
          ...auctionDetailDto().product!,
          primaryImage: null,
          images: [],
        },
      }),
    );

    expect(mapped.product?.primaryImage).toBe(FALLBACK_PRODUCT_IMAGE);
  });
});

describe("Auction routing", () => {
  it("declares the public auction detail route", () => {
    const route = auctionRoutes.find((item) => item.path === "auctions/:auctionId");
    expect(route?.element).toBeDefined();
  });
});

describe("AuctionDetailPage", () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    useAuthStore.getState().clearSession();
    cleanup();
  });

  it("renders detail content and anonymous bidding CTA", async () => {
    useAuthStore.getState().setStatus("anonymous");
    apiClient.defaults.adapter = async (config) =>
      createResponse(config, 200, createApiResponse(auctionDetailDto()));

    renderDetailPage();

    expect(await screen.findByRole("heading", { name: /Tượng gỗ trắc/i })).toBeInTheDocument();
    expect(screen.getByText(/12.000.000 VN/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Đăng nhập để tham gia/i })).toHaveAttribute(
      "href",
      "/bidding/501",
    );
    expect(screen.getByRole("link", { name: /Nạp ví VNPay/i })).toHaveAttribute("target", "_blank");
    expect(screen.queryByRole("link", { name: /Quay lại danh sách/i })).not.toBeInTheDocument();
  });

  it("renders ended result CTA for completed auctions", async () => {
    useAuthStore.getState().setStatus("authenticated");
    apiClient.defaults.adapter = async (config) =>
      createResponse(config, 200, createApiResponse(auctionDetailDto({ status: "ENDED_SUCCESS" })));

    renderDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Xem kết quả cá nhân/i })).toHaveAttribute(
        "href",
        "/bidding/501",
      );
    });
  });

  it("opens an image viewer from the main product image", async () => {
    useAuthStore.getState().setStatus("anonymous");
    apiClient.defaults.adapter = async (config) =>
      createResponse(config, 200, createApiResponse(auctionDetailDto()));

    renderDetailPage();

    fireEvent.click(await screen.findByRole("button", { name: /Phóng to ảnh sản phẩm/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xem ảnh tiếp theo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đóng/i })).toBeInTheDocument();
  });

  it("highlights active auctions that are close to ending", async () => {
    useAuthStore.getState().setStatus("anonymous");
    const soonEndTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    apiClient.defaults.adapter = async (config) =>
      createResponse(config, 200, createApiResponse(auctionDetailDto({ endTime: soonEndTime })));

    renderDetailPage();

    expect(await screen.findByText(/Sắp kết thúc/i)).toBeInTheDocument();
    expect(screen.getByText(/Giai đoạn nước rút/i)).toBeInTheDocument();
  });
});
