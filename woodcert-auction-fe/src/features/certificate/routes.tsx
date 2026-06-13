import { lazy } from "react";
import type { RouteObject } from "react-router";

const CertificatePage = lazy(() =>
  import("./pages/CertificatePage").then((module) => ({
    default: module.CertificatePage,
  })),
);

export const certificateRoutes: RouteObject[] = [
  { path: "certificates", element: <CertificatePage /> },
  { path: "certificates/:certificateCode", element: <CertificatePage /> },
];
