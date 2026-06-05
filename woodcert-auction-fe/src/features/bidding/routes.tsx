import { lazy } from "react";
import type { RouteObject } from "react-router";

const BiddingRoomPage = lazy(() => import("./pages/BiddingRoomPage"));

export const biddingRoutes: RouteObject[] = [
  {
    path: "bidding/:auctionId",
    element: <BiddingRoomPage />,
  },
];
