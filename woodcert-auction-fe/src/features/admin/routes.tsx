import type { RouteObject } from "react-router";

import { AdminRevenuePage } from "./pages/AdminRevenuePage";

export const adminRoutes: RouteObject[] = [
  {
    path: "admin/revenue",
    element: <AdminRevenuePage />,
  },
];
