import { lazy } from "react";
import type { RouteObject } from "react-router";

import { SELLER_ROUTE_PATHS } from "./constants/routes";

const SellerAuctionDetailPage = lazy(() =>
  import("./pages/SellerAuctionDetailPage").then((module) => ({
    default: module.SellerAuctionDetailPage,
  })),
);
const SellerAuctionsPage = lazy(() =>
  import("./pages/SellerAuctionsPage").then((module) => ({
    default: module.SellerAuctionsPage,
  })),
);
const SellerDashboardPage = lazy(() =>
  import("./pages/SellerDashboardPage").then((module) => ({
    default: module.SellerDashboardPage,
  })),
);
const SellerNewAuctionPage = lazy(() =>
  import("./pages/SellerNewAuctionPage").then((module) => ({
    default: module.SellerNewAuctionPage,
  })),
);
const SellerNewProductPage = lazy(() =>
  import("./pages/SellerNewProductPage").then((module) => ({
    default: module.SellerNewProductPage,
  })),
);
const SellerOrdersPage = lazy(() =>
  import("@/features/order/pages/SellerOrdersPage").then((module) => ({
    default: module.SellerOrdersPage,
  })),
);
const SellerProductDetailPage = lazy(() =>
  import("./pages/SellerProductDetailPage").then((module) => ({
    default: module.SellerProductDetailPage,
  })),
);
const SellerProductsPage = lazy(() =>
  import("./pages/SellerProductsPage").then((module) => ({
    default: module.SellerProductsPage,
  })),
);
const SellerProfilePage = lazy(() =>
  import("./pages/SellerProfilePage").then((module) => ({
    default: module.SellerProfilePage,
  })),
);
const SellerRegisterPage = lazy(() =>
  import("./pages/SellerRegisterPage").then((module) => ({
    default: module.SellerRegisterPage,
  })),
);

export const sellerRoutes: RouteObject[] = [
  {
    path: SELLER_ROUTE_PATHS.dashboard,
    element: <SellerDashboardPage />,
  },
  {
    path: SELLER_ROUTE_PATHS.profile,
    element: <SellerProfilePage />,
  },
  {
    path: SELLER_ROUTE_PATHS.products,
    element: <SellerProductsPage />,
  },
  {
    path: SELLER_ROUTE_PATHS.newProduct,
    element: <SellerNewProductPage />,
  },
  {
    path: "seller/products/:productId",
    element: <SellerProductDetailPage />,
  },
  {
    path: SELLER_ROUTE_PATHS.editProduct,
    element: <SellerNewProductPage />,
  },
  {
    path: SELLER_ROUTE_PATHS.auctions,
    element: <SellerAuctionsPage />,
  },
  {
    path: SELLER_ROUTE_PATHS.newAuction,
    element: <SellerNewAuctionPage />,
  },
  {
    path: SELLER_ROUTE_PATHS.orders,
    element: <SellerOrdersPage />,
  },
  {
    path: SELLER_ROUTE_PATHS.auctionDetail,
    element: <SellerAuctionDetailPage />,
  },
];

export const sellerRegisterRoutes: RouteObject[] = [
  {
    path: SELLER_ROUTE_PATHS.register,
    element: <SellerRegisterPage />,
  },
];
