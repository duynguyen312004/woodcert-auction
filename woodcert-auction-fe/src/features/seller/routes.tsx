/**
 * Khai báo route cho feature seller.
 *
 * sellerRoutes chạy trong SellerLayout và guard riêng. Route đăng ký seller nằm
 * ở layout public có bảo vệ vì người chưa là seller vẫn cần vào được trang này.
 */
import type { RouteObject } from "react-router";

import { SELLER_ROUTE_PATHS } from "./constants/routes";
import { SellerDashboardPage } from "./pages/SellerDashboardPage";
import { SellerPlaceholderPage } from "./pages/SellerPlaceholderPage";
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
    element: (
      <SellerPlaceholderPage
        title="Quản lý sản phẩm"
        description="Màn hình danh sách, tạo và cập nhật sản phẩm seller sẽ được triển khai ở bước CRUD tiếp theo."
      />
    ),
  },
  {
    path: SELLER_ROUTE_PATHS.newProduct,
    element: (
      <SellerPlaceholderPage
        title="Đăng sản phẩm mới"
        description="Form tạo sản phẩm và upload ảnh sẽ dùng API product hiện có trong bước tiếp theo."
      />
    ),
  },
  {
    path: SELLER_ROUTE_PATHS.auctions,
    element: (
      <SellerPlaceholderPage
        title="Quản lý phiên đấu giá"
        description="Danh sách phiên đấu giá của seller sẽ dùng dữ liệu từ API /auctions/me."
      />
    ),
  },
  {
    path: SELLER_ROUTE_PATHS.newAuction,
    element: (
      <SellerPlaceholderPage
        title="Tạo phiên đấu giá"
        description="Form tạo phiên sẽ chọn sản phẩm đã kiểm định và gọi API tạo auction session."
      />
    ),
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
