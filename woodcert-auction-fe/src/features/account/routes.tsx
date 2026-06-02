import type { RouteObject } from "react-router";

import { AddressBookPage } from "./pages/AddressBookPage";
import { AccountPage } from "./pages/AccountPage";

export const accountRoutes: RouteObject[] = [
  { path: "account", element: <AccountPage /> },
  { path: "account/addresses", element: <AddressBookPage /> },
];
