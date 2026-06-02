import type { RouteObject } from "react-router";
import { HomePage } from "./HomePage";
import { GuidePage } from "./GuidePage";
import { AboutPage } from "./AboutPage";

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
