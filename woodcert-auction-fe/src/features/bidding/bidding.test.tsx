import {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { getBiddingAuctionDetail, getBiddingParticipation, withdrawAuction } from "./api/bidding";
import { BidControlPanel } from "./components/BidControlPanel";
import { ConnectionBanner } from "./components/ConnectionBanner";
import { EndedOverlay } from "./components/EndedOverlay";
import { biddingRoutes } from "./routes";
import type { BiddingAuctionDetail, ParticipationStatus } from "./types";

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
    timestamp: "2026-05-31T00:00:00Z",
  };
}

describe("biddingApi", () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("fetches participation including highestBidder from the backend contract", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/auctions/501/my-participation");
      expect(config.requiresAuth).toBe(true);

      return createResponse(
        config,
        200,
        createApiResponse({
          sellerOwned: false,
          registered: true,
          depositStatus: "FROZEN",
          highestBidder: true,
          canRegister: false,
          canWithdraw: false,
          canBid: false,
          reasonCode: "CURRENT_HIGHEST_BIDDER",
          reasonMessage: "You are currently the highest bidder",
          depositAmount: "5000000",
          winner: false,
          outcomeCode: "NONE",
          outcomeMessage: "Auction is ongoing or waiting",
        }),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(getBiddingParticipation(501)).resolves.toMatchObject({
      registered: true,
      highestBidder: true,
      canBid: false,
      depositAmount: 5000000,
      outcomeCode: "NONE",
    });
  });

  it("withdraws from a waiting auction", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/auctions/501/withdraw");
      expect(config.requiresAuth).toBe(true);
      return createResponse(config, 200, createApiResponse(null));
    };
    apiClient.defaults.adapter = adapter;

    await expect(withdrawAuction(501)).resolves.toBeNull();
  });

  it("maps public auction detail appraisal and image fields from backend DTO", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/auctions/501");

      return createResponse(
        config,
        200,
        createApiResponse({
          id: 501,
          status: "ACTIVE",
          startingPrice: "10000000",
          currentPrice: "12000000",
          stepPrice: "500000",
          depositAmount: "1000000",
          startTime: "2026-05-31T01:00:00Z",
          endTime: "2026-05-31T02:00:00Z",
          product: {
            id: 101,
            title: "Tượng gỗ",
            material: "Gỗ trắc",
            description: "Mo ta chi tiet san pham",
            dimensions: "40 x 30 x 80 cm",
            weight: "12.5",
            primaryImage: "https://cdn.example/primary.jpg",
            images: ["https://cdn.example/primary.jpg", "https://cdn.example/side.jpg"],
            appraisal: {
              certificateCode: "CERT-501",
              verifiedMaterial: "Go trac",
              origin: "Viet Nam",
              ageEstimation: "20 nam",
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
        }),
      );
    };
    apiClient.defaults.adapter = adapter;

    await expect(getBiddingAuctionDetail(501)).resolves.toMatchObject({
      id: 501,
      currentPrice: 12000000,
      product: {
        description: "Mo ta chi tiet san pham",
        dimensions: "40 x 30 x 80 cm",
        weight: 12.5,
        imageUrls: ["https://cdn.example/primary.jpg", "https://cdn.example/side.jpg"],
        certificateCode: "CERT-501",
        isAuthentic: true,
        appraisal: {
          verifiedMaterial: "Go trac",
          origin: "Viet Nam",
          ageEstimation: "20 nam",
          conditionGrade: "GOOD",
          estimatedValue: 15000000,
          isAuthentic: true,
        },
      },
      highestBidderMaskedAlias: "abcd****",
    });
  });
});

describe("Bidding Routing Configuration", () => {
  it("declares the bidding room route", () => {
    const biddingRoute = biddingRoutes.find((route) => route.path === "bidding/:auctionId");
    expect(biddingRoute).toBeDefined();
    expect(biddingRoute?.element).toBeDefined();
  });
});

describe("ConnectionBanner", () => {
  it("does not render when connected", () => {
    const { container } = render(<ConnectionBanner status="connected" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders reconnecting state", () => {
    render(<ConnectionBanner status="reconnecting" />);
    expect(screen.getByText(/kết nối lại/i)).toBeInTheDocument();
  });
});

describe("EndedOverlay", () => {
  it("renders winner result", () => {
    render(
      <MemoryRouter>
        <EndedOverlay outcomeCode="WINNER" />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Chúc mừng/i)).toBeInTheDocument();
  });
});

describe("BidControlPanel", () => {
  const mockDetail: BiddingAuctionDetail = {
    id: 1,
    status: "ACTIVE",
    startingPrice: 1000000,
    currentPrice: 1200000,
    stepPrice: 100000,
    depositAmount: 100000,
    startTime: "2026-05-01T00:00:00Z",
    endTime: "2026-05-01T02:00:00Z",
    product: null,
    seller: null,
    highestBidderMaskedAlias: null,
  };

  const baseParticipation: ParticipationStatus = {
    sellerOwned: false,
    registered: true,
    depositStatus: "FROZEN",
    highestBidder: false,
    canRegister: false,
    canWithdraw: false,
    canBid: true,
    reasonCode: "CAN_BID",
    reasonMessage: "You can place bids in this auction",
    depositAmount: 100000,
    winner: false,
    outcomeCode: "NONE",
    outcomeMessage: "",
  };

  const mockOnPlaceBid = vi.fn();
  const mockOnRegister = vi.fn();
  const mockOnWithdraw = vi.fn();

  it("shows registration prompt when user has not registered", () => {
    render(
      <MemoryRouter>
        <BidControlPanel
          detail={mockDetail}
          participation={{
            ...baseParticipation,
            registered: false,
            depositStatus: null,
            canRegister: true,
            canBid: false,
          }}
          isPlacingBid={false}
          isRegistering={false}
          isWithdrawing={false}
          onPlaceBid={mockOnPlaceBid}
          onRegister={mockOnRegister}
          onWithdraw={mockOnWithdraw}
          walletBalance={200000}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Yêu cầu đăng ký ký quỹ/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đăng ký ký quỹ ngay/i })).toBeInTheDocument();
  });

  it("shows bid form when user can bid", () => {
    render(
      <MemoryRouter>
        <BidControlPanel
          detail={mockDetail}
          participation={baseParticipation}
          isPlacingBid={false}
          isRegistering={false}
          isWithdrawing={false}
          onPlaceBid={mockOnPlaceBid}
          onRegister={mockOnRegister}
          onWithdraw={mockOnWithdraw}
          walletBalance={200000}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /^Đặt giá$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+1 bước/i })).toBeInTheDocument();
  });

  it("accepts any bid at or above the minimum increment", async () => {
    mockOnPlaceBid.mockReset();
    mockOnPlaceBid.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <BidControlPanel
          detail={mockDetail}
          participation={baseParticipation}
          isPlacingBid={false}
          isRegistering={false}
          isWithdrawing={false}
          onPlaceBid={mockOnPlaceBid}
          onRegister={mockOnRegister}
          onWithdraw={mockOnWithdraw}
          walletBalance={200000}
        />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "1350000" } });
    fireEvent.click(screen.getByRole("button", { name: /^Đặt giá$/i }));

    await waitFor(() => expect(mockOnPlaceBid).toHaveBeenCalledWith(1350000));
  });

  it("locks bid form when user is current highest bidder", () => {
    render(
      <MemoryRouter>
        <BidControlPanel
          detail={mockDetail}
          participation={{
            ...baseParticipation,
            highestBidder: true,
            canBid: false,
            reasonCode: "CURRENT_HIGHEST_BIDDER",
          }}
          isPlacingBid={false}
          isRegistering={false}
          isWithdrawing={false}
          onPlaceBid={mockOnPlaceBid}
          onRegister={mockOnRegister}
          onWithdraw={mockOnWithdraw}
          walletBalance={200000}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Bạn đang là người dẫn đầu/i)).toBeInTheDocument();
    expect(screen.getByText(/Bạn đang giữ giá cao nhất/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+1 bước/i })).toBeDisabled();
  });

  it("locks bid form when current user is seller", () => {
    render(
      <MemoryRouter>
        <BidControlPanel
          detail={mockDetail}
          participation={{
            ...baseParticipation,
            sellerOwned: true,
            registered: false,
            depositStatus: null,
            canBid: false,
            reasonCode: "SELLER_OWN_AUCTION",
          }}
          isPlacingBid={false}
          isRegistering={false}
          isWithdrawing={false}
          onPlaceBid={mockOnPlaceBid}
          onRegister={mockOnRegister}
          onWithdraw={mockOnWithdraw}
          walletBalance={200000}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Bạn là chủ sở hữu/i)).toBeInTheDocument();
  });

  it("shows withdrawal action for a waiting frozen participant", () => {
    render(
      <MemoryRouter>
        <BidControlPanel
          detail={{ ...mockDetail, status: "WAITING" }}
          participation={{
            ...baseParticipation,
            canBid: false,
            canWithdraw: true,
            reasonCode: "WAITING_FOR_ACTIVATION",
          }}
          isPlacingBid={false}
          isRegistering={false}
          isWithdrawing={false}
          onPlaceBid={mockOnPlaceBid}
          onRegister={mockOnRegister}
          onWithdraw={mockOnWithdraw}
          walletBalance={200000}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /Rút khỏi phiên/i })).toBeInTheDocument();
  });

  it("confirms withdrawal through the modal", async () => {
    mockOnWithdraw.mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter>
        <BidControlPanel
          detail={{ ...mockDetail, status: "WAITING" }}
          participation={{
            ...baseParticipation,
            canBid: false,
            canWithdraw: true,
            reasonCode: "WAITING_FOR_ACTIVATION",
          }}
          isPlacingBid={false}
          isRegistering={false}
          isWithdrawing={false}
          onPlaceBid={mockOnPlaceBid}
          onRegister={mockOnRegister}
          onWithdraw={mockOnWithdraw}
          walletBalance={200000}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Rút khỏi phiên/i }));
    expect(screen.getByText(/Bạn sẽ không thể đăng ký lại phiên này/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Xác nhận rút/i }));

    await waitFor(() => expect(mockOnWithdraw).toHaveBeenCalledTimes(1));
  });

  it("shows withdrawn state without registration or bid actions", () => {
    render(
      <MemoryRouter>
        <BidControlPanel
          detail={{ ...mockDetail, status: "WAITING" }}
          participation={{
            ...baseParticipation,
            depositStatus: "WITHDRAWN",
            canBid: false,
            canWithdraw: false,
            reasonCode: "PARTICIPATION_WITHDRAWN",
            outcomeCode: "WITHDRAWN",
          }}
          isPlacingBid={false}
          isRegistering={false}
          isWithdrawing={false}
          onPlaceBid={mockOnPlaceBid}
          onRegister={mockOnRegister}
          onWithdraw={mockOnWithdraw}
          walletBalance={200000}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Đã rút khỏi phiên/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Đăng ký ký quỹ ngay/i })).not.toBeInTheDocument();
  });
});
