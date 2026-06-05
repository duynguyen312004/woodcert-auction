import { lazy } from "react";
import type { RouteObject } from "react-router";

const BlogDetailPage = lazy(() =>
  import("./pages/BlogDetailPage").then((module) => ({
    default: module.BlogDetailPage,
  })),
);
const BlogListPage = lazy(() =>
  import("./pages/BlogListPage").then((module) => ({
    default: module.BlogListPage,
  })),
);

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
