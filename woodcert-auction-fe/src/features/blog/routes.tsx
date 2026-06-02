import type { RouteObject } from "react-router";
import { BlogListPage } from "./pages/BlogListPage";
import { BlogDetailPage } from "./pages/BlogDetailPage";

export const blogRoutes: RouteObject[] = [
  {
    path: "blog",
    element: <BlogListPage />,
  },
  {
    path: "blog/:postId",
    element: <BlogDetailPage />,
  },
];
