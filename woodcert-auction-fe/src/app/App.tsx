import { Suspense, useEffect } from "react";
import { RouterProvider } from "react-router";

import { ErrorBoundary } from "@/app/providers/ErrorBoundary";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { router } from "@/app/router";
import { AuthSessionEffects } from "@/shared/auth/AuthSessionEffects";
import { initializeAuth } from "@/shared/auth/auth-initializer";
import { NotificationProvider } from "@/shared/ui/notification";

function AppFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

export function App() {
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<AppFallback />}>
        <QueryProvider>
          <NotificationProvider>
            <AuthSessionEffects />
            <RouterProvider router={router} />
          </NotificationProvider>
        </QueryProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
