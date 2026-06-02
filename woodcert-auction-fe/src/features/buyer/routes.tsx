import type { RouteObject } from "react-router";

import { BuyerAuctionDetailPage } from "./pages/BuyerAuctionDetailPage";
import { BuyerAuctionsPage } from "./pages/BuyerAuctionsPage";

export const buyerRoutes: RouteObject[] = [
  { path: "my-auctions", element: <BuyerAuctionsPage /> },
  { path: "my-auctions/:auctionId", element: <BuyerAuctionDetailPage /> },
];
