/**
 * Cấu hình route chính của giao diện.
 *
 * Route khu seller và appraiser được tách khỏi PublicLayout để dùng sidebar riêng.
 * Các trang public, tài khoản và admin vẫn dùng header/footer chung.
 */
import type { RouteObject } from "react-router";

import { AppraiserLayout } from "@/app/layouts/AppraiserLayout";
import { SellerLayout } from "@/app/layouts/SellerLayout";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { AdminPortalGuard } from "@/app/router/AdminPortalGuard";
import { AppraiserPortalGuard } from "@/app/router/AppraiserPortalGuard";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { PublicAppraiserGuard } from "@/app/router/PublicAppraiserGuard";
import { SellerPortalGuard } from "@/app/router/SellerPortalGuard";
import { accountRoutes } from "@/features/account";
import { adminRoutes } from "@/features/admin/routes";
import { appraisalRoutes } from "@/features/appraisal/routes";
import { auctionRoutes } from "@/features/auction/routes";
import { authRoutes } from "@/features/auth";
import { biddingRoutes } from "@/features/bidding/routes";
import { buyerRoutes } from "@/features/buyer";
import { catalogRoutes } from "@/features/catalog";
import { homeRoutes } from "@/features/home/routes";
import { sellerRegisterRoutes, sellerRoutes } from "@/features/seller";
import { walletRoutes } from "@/features/wallet";

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
    element: <PublicAppraiserGuard />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          ...homeRoutes,
          ...auctionRoutes,
          ...catalogRoutes,
          {
            element: <ProtectedRoute />,
            children: [
              ...accountRoutes,
              ...walletRoutes,
              ...buyerRoutes,
              ...sellerRegisterRoutes,
              {
                element: <AdminPortalGuard />,
                children: adminRoutes,
              },
            ],
          },
        ],
      },
    ],
  },
];
