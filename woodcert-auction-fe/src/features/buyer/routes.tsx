import { lazy } from "react";
import type { RouteObject } from "react-router";

const BuyerAuctionDetailPage = lazy(() =>
  import("./pages/BuyerAuctionDetailPage").then((module) => ({
    default: module.BuyerAuctionDetailPage,
  })),
);
const BuyerAuctionsPage = lazy(() =>
  import("./pages/BuyerAuctionsPage").then((module) => ({
    default: module.BuyerAuctionsPage,
  })),
);

export const buyerRoutes: RouteObject[] = [
  { path: "my-auctions", element: <BuyerAuctionsPage /> },
  { path: "my-auctions/:auctionId", element: <BuyerAuctionDetailPage /> },
];
