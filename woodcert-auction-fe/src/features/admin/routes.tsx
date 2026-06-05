import { lazy } from "react";
import type { RouteObject } from "react-router";

const AdminAuditLogsPage = lazy(() =>
  import("./pages/AdminAuditLogsPage").then((module) => ({
    default: module.AdminAuditLogsPage,
  })),
);
const AdminCategoriesPage = lazy(() =>
  import("./pages/AdminCategoriesPage").then((module) => ({
    default: module.AdminCategoriesPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import("./pages/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
  })),
);
const AdminDisputeDetailPage = lazy(() =>
  import("./pages/AdminDisputeDetailPage").then((module) => ({
    default: module.AdminDisputeDetailPage,
  })),
);
const AdminDisputesPage = lazy(() =>
  import("./pages/AdminDisputesPage").then((module) => ({
    default: module.AdminDisputesPage,
  })),
);
const AdminRevenuePage = lazy(() =>
  import("./pages/AdminRevenuePage").then((module) => ({
    default: module.AdminRevenuePage,
  })),
);
const AdminUsersPage = lazy(() =>
  import("./pages/AdminUsersPage").then((module) => ({
    default: module.AdminUsersPage,
  })),
);

export const adminRoutes: RouteObject[] = [
  {
    path: "admin",
    element: <AdminDashboardPage />,
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
    path: "admin/users",
    element: <AdminUsersPage />,
  },
  {
    path: "admin/audit-logs",
    element: <AdminAuditLogsPage />,
  },
];
