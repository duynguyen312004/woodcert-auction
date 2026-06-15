import { lazy } from "react";
import type { RouteObject } from "react-router";

const BuyerOrderDetailPage = lazy(() =>
  import("./pages/BuyerOrderDetailPage").then((module) => ({
    default: module.BuyerOrderDetailPage,
  })),
);
const BuyerOrdersPage = lazy(() =>
  import("./pages/BuyerOrdersPage").then((module) => ({
    default: module.BuyerOrdersPage,
  })),
);
const BuyerDisputeDetailPage = lazy(() =>
  import("@/features/dispute/pages/ParticipantDisputeDetailPage").then((module) => ({
    default: module.BuyerDisputeDetailPage,
  })),
);

export const orderRoutes: RouteObject[] = [
  { path: "orders", element: <BuyerOrdersPage /> },
  { path: "orders/:orderId", element: <BuyerOrderDetailPage /> },
  { path: "orders/:orderId/disputes/:disputeId", element: <BuyerDisputeDetailPage /> },
];
