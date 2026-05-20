import type { RouteObject } from "react-router";

import { AccountPage } from "./pages/AccountPage";

export const accountRoutes: RouteObject[] = [{ path: "account", element: <AccountPage /> }];
