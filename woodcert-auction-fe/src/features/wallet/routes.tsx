import type { RouteObject } from "react-router";
import { WalletPage } from "./pages/WalletPage";
import { WalletDepositPage } from "./pages/WalletDepositPage";
import { WalletDepositResultPage } from "./pages/WalletDepositResultPage";

export const walletRoutes: RouteObject[] = [
  { path: "wallet", element: <WalletPage /> },
  { path: "wallet/deposit", element: <WalletDepositPage /> },
  { path: "wallet/deposit/result", element: <WalletDepositResultPage /> },
];
