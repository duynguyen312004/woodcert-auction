import { lazy } from "react";
import type { RouteObject } from "react-router";

import { NotFoundPage } from "@/app/router/NotFoundPage";
import { APPRAISER_ROUTE_PATHS } from "@/shared/constants/routes";

const AppraiserProductDetailPage = lazy(() =>
  import("./pages/AppraiserProductDetailPage").then((module) => ({
    default: module.AppraiserProductDetailPage,
  })),
);
const AppraiserQueuePage = lazy(() =>
  import("./pages/AppraiserQueuePage").then((module) => ({
    default: module.AppraiserQueuePage,
  })),
);
const AppraiserReviewedPage = lazy(() =>
  import("./pages/AppraiserReviewedPage").then((module) => ({
    default: module.AppraiserReviewedPage,
  })),
);

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
  {
    path: "appraiser/*",
    element: (
      <NotFoundPage
        homePath="/appraiser/products"
        homeLabel="Về hàng chờ kiểm định"
        appearance="light"
      />
    ),
  },
];
