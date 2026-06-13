import { lazy } from "react";
import type { RouteObject } from "react-router";

const AccountPage = lazy(() =>
  import("./pages/AccountPage").then((module) => ({ default: module.AccountPage })),
);
const AddressBookPage = lazy(() =>
  import("./pages/AddressBookPage").then((module) => ({
    default: module.AddressBookPage,
  })),
);

export const accountRoutes: RouteObject[] = [
  { path: "account", element: <AccountPage /> },
  { path: "account/addresses", element: <AddressBookPage /> },
];
