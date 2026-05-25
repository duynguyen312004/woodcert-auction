/**
 * Khai báo route cho khu appraiser.
 *
 * Các route này chạy trong AppraiserLayout và được bảo vệ bởi AppraiserPortalGuard.
 */
import type { RouteObject } from "react-router";

import { APPRAISER_ROUTE_PATHS } from "@/shared/constants/routes";

import { AppraiserProductDetailPage } from "./pages/AppraiserProductDetailPage";
import { AppraiserQueuePage } from "./pages/AppraiserQueuePage";
import { AppraiserReviewedPage } from "./pages/AppraiserReviewedPage";

export const appraisalRoutes: RouteObject[] = [
  {
    path: APPRAISER_ROUTE_PATHS.products,
    element: <AppraiserQueuePage />,
  },
  {
    path: APPRAISER_ROUTE_PATHS.productDetail,
    element: <AppraiserProductDetailPage />,
  },
  {
    path: APPRAISER_ROUTE_PATHS.reviewed,
    element: <AppraiserReviewedPage />,
  },
];
