import type { RouteObject } from "react-router";

import { CertificatePage } from "./pages/CertificatePage";

export const certificateRoutes: RouteObject[] = [
  { path: "certificates", element: <CertificatePage /> },
  { path: "certificates/:certificateCode", element: <CertificatePage /> },
];
