/**
 * Định nghĩa các routes cho chức năng Bidding.
 *
 * Chứa cấu hình route để trỏ đường dẫn "bidding/:auctionId" về trang BiddingRoomPage.
 */

import type { RouteObject } from "react-router";
import BiddingRoomPage from "./pages/BiddingRoomPage";

export const biddingRoutes: RouteObject[] = [
  {
    path: "bidding/:auctionId",
    element: <BiddingRoomPage />,
  },
];
