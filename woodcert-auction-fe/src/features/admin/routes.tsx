import type { RouteObject } from "react-router";

import { AdminAppraisersPage } from "./pages/AdminAppraisersPage";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage";
import { AdminDisputeDetailPage } from "./pages/AdminDisputeDetailPage";
import { AdminDisputesPage } from "./pages/AdminDisputesPage";
import { AdminRevenuePage } from "./pages/AdminRevenuePage";

export const adminRoutes: RouteObject[] = [
  {
    path: "admin",
    element: <AdminRevenuePage />,
  },
  {
    path: "admin/revenue",
    element: <AdminRevenuePage />,
  },
  {
    path: "admin/disputes",
    element: <AdminDisputesPage />,
  },
  {
    path: "admin/disputes/:id",
    element: <AdminDisputeDetailPage />,
  },
  {
    path: "admin/categories",
    element: <AdminCategoriesPage />,
  },
  {
    path: "admin/appraisers",
    element: <AdminAppraisersPage />,
  },
];
