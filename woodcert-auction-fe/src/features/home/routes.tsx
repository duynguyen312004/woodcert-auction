import { lazy } from "react";
import type { RouteObject } from "react-router";
import { HomePage } from "./HomePage";

const AboutPage = lazy(() =>
  import("./AboutPage").then((module) => ({ default: module.AboutPage })),
);
const GuidePage = lazy(() =>
  import("./GuidePage").then((module) => ({ default: module.GuidePage })),
);

export const homeRoutes: RouteObject[] = [
  {
    index: true,
    element: <HomePage />,
  },
  {
    path: "about",
    element: <AboutPage />,
  },
  {
    path: "guide",
    element: <GuidePage />,
  },
];
