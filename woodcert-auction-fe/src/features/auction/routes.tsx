import { lazy } from "react";
import type { RouteObject } from "react-router";

const AuctionDetailPage = lazy(() =>
  import("./pages/AuctionDetailPage").then((module) => ({
    default: module.AuctionDetailPage,
  })),
);
const AuctionListPage = lazy(() =>
  import("./pages/AuctionListPage").then((module) => ({ default: module.AuctionListPage })),
);

export const auctionRoutes: RouteObject[] = [
  {
    path: "auctions",
    element: <AuctionListPage />,
  },
  {
    path: "auctions/:auctionId",
    element: <AuctionDetailPage />,
  },
];
