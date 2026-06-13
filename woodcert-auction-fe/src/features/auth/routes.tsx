import { lazy } from "react";
import type { RouteObject } from "react-router";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { AnonymousOnlyRoute } from "@/app/router/AnonymousOnlyRoute";

const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const PendingVerificationPage = lazy(() =>
  import("./pages/PendingVerificationPage").then((module) => ({
    default: module.PendingVerificationPage,
  })),
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import("./pages/VerifyEmailPage").then((module) => ({ default: module.VerifyEmailPage })),
);

export const authRoutes: RouteObject[] = [
  {
    path: "auth",
    element: <AuthLayout />,
    children: [
      {
        element: <AnonymousOnlyRoute />,
        children: [
          {
            path: "login",
            element: <LoginPage />,
          },
          {
            path: "register",
            element: <RegisterPage />,
          },
          {
            path: "verify-pending",
            element: <PendingVerificationPage />,
          },
        ],
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "verify-email",
        element: <VerifyEmailPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
];
