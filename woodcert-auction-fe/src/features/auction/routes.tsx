import type { RouteObject } from "react-router";

import { AuctionListPage } from "./pages/AuctionListPage";

export const auctionRoutes: RouteObject[] = [
  {
    path: "auctions",
    element: <AuctionListPage />,
  },
];
