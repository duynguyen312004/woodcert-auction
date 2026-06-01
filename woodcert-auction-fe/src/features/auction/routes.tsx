import type { RouteObject } from "react-router";
import { AuctionDetailPage } from "./pages/AuctionDetailPage";
import { AuctionListPage } from "./pages/AuctionListPage";

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
