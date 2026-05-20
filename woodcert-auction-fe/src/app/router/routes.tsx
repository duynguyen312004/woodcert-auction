import type { RouteObject } from "react-router";

import { PublicLayout } from "@/app/layouts/PublicLayout";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { accountRoutes } from "@/features/account/routes";
import { adminRoutes } from "@/features/admin/routes";
import { appraisalRoutes } from "@/features/appraisal/routes";
import { auctionRoutes } from "@/features/auction/routes";
import { authRoutes } from "@/features/auth/routes";
import { biddingRoutes } from "@/features/bidding/routes";
import { catalogRoutes } from "@/features/catalog/routes";
import { homeRoutes } from "@/features/home/routes";
import { sellerRoutes } from "@/features/seller/routes";
import { walletRoutes } from "@/features/wallet/routes";

export const routes: RouteObject[] = [
  ...authRoutes,
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
          ...sellerRoutes,
          ...adminRoutes,
        ],
      },
    ],
  },
];
