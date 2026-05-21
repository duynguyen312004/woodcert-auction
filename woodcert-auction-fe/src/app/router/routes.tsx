/**
 * Cấu hình route chính của giao diện.
 *
 * Route khu seller được tách khỏi PublicLayout để dùng sidebar riêng. Các trang
 * public, tài khoản và admin vẫn dùng header/footer chung.
 */
import type { RouteObject } from "react-router";

import { SellerLayout } from "@/app/layouts/SellerLayout";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { SellerPortalGuard } from "@/app/router/SellerPortalGuard";
import { accountRoutes } from "@/features/account/routes";
import { adminRoutes } from "@/features/admin/routes";
import { appraisalRoutes } from "@/features/appraisal/routes";
import { auctionRoutes } from "@/features/auction/routes";
import { authRoutes } from "@/features/auth/routes";
import { biddingRoutes } from "@/features/bidding/routes";
import { catalogRoutes } from "@/features/catalog/routes";
import { homeRoutes } from "@/features/home/routes";
import { sellerRegisterRoutes, sellerRoutes } from "@/features/seller/routes";
import { walletRoutes } from "@/features/wallet/routes";

export const routes: RouteObject[] = [
  ...authRoutes,

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
    ],
  },

  // Các trang public dùng header và footer chung.
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
          ...biddingRoutes,
          ...walletRoutes,
          ...appraisalRoutes,
          ...sellerRegisterRoutes,
          ...adminRoutes,
        ],
      },
    ],
  },
];
