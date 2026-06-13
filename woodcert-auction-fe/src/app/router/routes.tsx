/**
 * Cấu hình route chính của giao diện.
 *
 * Route khu seller và appraiser được tách khỏi PublicLayout để dùng sidebar riêng.
 * Các trang public, tài khoản và admin vẫn dùng header/footer chung.
 */
import { lazy } from "react";
import type { RouteObject } from "react-router";

import { PublicLayout } from "@/app/layouts/PublicLayout";
import { NotFoundPage } from "@/app/router/NotFoundPage";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { PublicPortalGuard } from "@/app/router/PublicPortalGuard";
import { accountRoutes } from "@/features/account";
import { adminRoutes } from "@/features/admin/routes";
import { appraisalRoutes } from "@/features/appraisal/routes";
import { auctionRoutes } from "@/features/auction/routes";
import { authRoutes } from "@/features/auth";
import { biddingRoutes } from "@/features/bidding/routes";
import { buyerRoutes } from "@/features/buyer";
import { catalogRoutes } from "@/features/catalog";
import { certificateRoutes } from "@/features/certificate";
import { blogRoutes } from "@/features/blog";
import { homeRoutes } from "@/features/home/routes";
import { orderRoutes } from "@/features/order/routes";
import { sellerRegisterRoutes, sellerRoutes } from "@/features/seller";
import { walletRoutes } from "@/features/wallet";

const AdminLayout = lazy(() =>
  import("@/app/layouts/AdminLayout").then((module) => ({ default: module.AdminLayout })),
);
const AppraiserLayout = lazy(() =>
  import("@/app/layouts/AppraiserLayout").then((module) => ({
    default: module.AppraiserLayout,
  })),
);
const SellerLayout = lazy(() =>
  import("@/app/layouts/SellerLayout").then((module) => ({ default: module.SellerLayout })),
);
const AdminPortalGuard = lazy(() =>
  import("@/app/router/AdminPortalGuard").then((module) => ({
    default: module.AdminPortalGuard,
  })),
);
const AppraiserPortalGuard = lazy(() =>
  import("@/app/router/AppraiserPortalGuard").then((module) => ({
    default: module.AppraiserPortalGuard,
  })),
);
const SellerPortalGuard = lazy(() =>
  import("@/app/router/SellerPortalGuard").then((module) => ({
    default: module.SellerPortalGuard,
  })),
);

export const routes: RouteObject[] = [
  ...authRoutes,

  // Phòng đấu giá cockpit được bảo vệ và dùng layout toàn màn hình riêng biệt
  {
    element: <ProtectedRoute />,
    children: biddingRoutes,
  },

  // Khu seller dùng layout riêng, không có header/footer chung.
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminPortalGuard />,
        children: [
          {
            element: <AdminLayout />,
            children: adminRoutes,
          },
        ],
      },
      {
        element: <SellerPortalGuard />,
        children: [
          {
            element: <SellerLayout />,
            children: sellerRoutes,
          },
        ],
      },
      // Khu appraiser dùng layout riêng, không có header/footer chung.
      {
        element: <AppraiserPortalGuard />,
        children: [
          {
            element: <AppraiserLayout />,
            children: appraisalRoutes,
          },
        ],
      },
    ],
  },

  // Các trang public dùng header và footer chung.
  {
    element: <PublicPortalGuard />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          ...homeRoutes,
          ...auctionRoutes,
          ...catalogRoutes,
          ...certificateRoutes,
          ...blogRoutes,
          {
            element: <ProtectedRoute />,
            children: [
              ...accountRoutes,
              ...walletRoutes,
              ...buyerRoutes,
              ...orderRoutes,
              ...sellerRegisterRoutes,
            ],
          },
          {
            path: "*",
            element: <NotFoundPage homePath="/" homeLabel="Về trang chủ" />,
          },
        ],
      },
    ],
  },
];
