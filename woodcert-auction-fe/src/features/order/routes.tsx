import type { RouteObject } from "react-router";

import { BuyerOrdersPage } from "./pages/BuyerOrdersPage";

export const orderRoutes: RouteObject[] = [{ path: "orders", element: <BuyerOrdersPage /> }];
