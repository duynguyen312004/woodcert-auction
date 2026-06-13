import { lazy } from "react";
import type { RouteObject } from "react-router";

const WalletPage = lazy(() =>
  import("./pages/WalletPage").then((module) => ({ default: module.WalletPage })),
);
const WalletDepositPage = lazy(() =>
  import("./pages/WalletDepositPage").then((module) => ({
    default: module.WalletDepositPage,
  })),
);
const WalletDepositResultPage = lazy(() =>
  import("./pages/WalletDepositResultPage").then((module) => ({
    default: module.WalletDepositResultPage,
  })),
);

export const walletRoutes: RouteObject[] = [
  { path: "wallet", element: <WalletPage /> },
  { path: "wallet/deposit", element: <WalletDepositPage /> },
  { path: "wallet/deposit/result", element: <WalletDepositResultPage /> },
];
