import { Navigate, useParams, type RouteObject } from "react-router";

import { AuctionListPage } from "./pages/AuctionListPage";

function AuctionBiddingRedirect() {
  const { auctionId } = useParams<{ auctionId: string }>();
  return <Navigate to={auctionId ? `/bidding/${auctionId}` : "/auctions"} replace />;
}

export const auctionRoutes: RouteObject[] = [
  {
    path: "auctions",
    element: <AuctionListPage />,
  },
  {
    path: "auctions/:auctionId",
    element: <AuctionBiddingRedirect />,
  },
];
