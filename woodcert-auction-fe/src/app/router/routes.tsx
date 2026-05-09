import type { RouteObject } from "react-router";

import { PublicLayout } from "@/app/layouts/PublicLayout";
import { RootPage } from "@/app/router/RootPage";
import { accountRoutes } from "@/features/account/routes";
import { adminRoutes } from "@/features/admin/routes";
import { appraisalRoutes } from "@/features/appraisal/routes";
import { auctionRoutes } from "@/features/auction/routes";
import { authRoutes } from "@/features/auth/routes";
import { biddingRoutes } from "@/features/bidding/routes";
import { catalogRoutes } from "@/features/catalog/routes";
import { sellerRoutes } from "@/features/seller/routes";
import { walletRoutes } from "@/features/wallet/routes";

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <RootPage />,
      },
      ...authRoutes,
      ...accountRoutes,
      ...auctionRoutes,
      ...biddingRoutes,
      ...walletRoutes,
      ...catalogRoutes,
      ...appraisalRoutes,
      ...sellerRoutes,
      ...adminRoutes,
    ],
  },
];
