/**
 * Khai báo route cho feature seller.
 *
 * sellerRoutes chạy trong SellerLayout và guard riêng. Route đăng ký seller nằm
 * ở layout public có bảo vệ vì người chưa là seller vẫn cần vào được trang này.
 */
import type { RouteObject } from "react-router";

import { SellerOrdersPage } from "@/features/order/pages/SellerOrdersPage";

import { SELLER_ROUTE_PATHS } from "./constants/routes";
import { SellerAuctionDetailPage } from "./pages/SellerAuctionDetailPage";
import { SellerAuctionsPage } from "./pages/SellerAuctionsPage";
import { SellerDashboardPage } from "./pages/SellerDashboardPage";
import { SellerNewAuctionPage } from "./pages/SellerNewAuctionPage";
import { SellerNewProductPage } from "./pages/SellerNewProductPage";
import { SellerPlaceholderPage } from "./pages/SellerPlaceholderPage";
import { SellerProductDetailPage } from "./pages/SellerProductDetailPage";
import { SellerProductsPage } from "./pages/SellerProductsPage";
import { SellerProfilePage } from "./pages/SellerProfilePage";
import { SellerRegisterPage } from "./pages/SellerRegisterPage";

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
  {
    path: SELLER_ROUTE_PATHS.appraisals,
    element: (
      <SellerPlaceholderPage
        title="Theo dõi kiểm định"
        description="Màn hình này sẽ theo dõi các sản phẩm đang chờ hoặc đã hoàn tất kiểm định."
      />
    ),
  },
];

export const sellerRegisterRoutes: RouteObject[] = [
  {
    path: SELLER_ROUTE_PATHS.register,
    element: <SellerRegisterPage />,
  },
];
