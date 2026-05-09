import { Suspense } from "react";
import { RouterProvider } from "react-router";

import { ErrorBoundary } from "@/app/providers/ErrorBoundary";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { router } from "@/app/router";

function AppFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<AppFallback />}>
        <QueryProvider>
          <RouterProvider router={router} />
        </QueryProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
