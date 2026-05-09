import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled application error", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The app shell caught an unexpected error. Reload the page to retry.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
