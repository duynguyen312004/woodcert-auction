import { refreshAccessToken } from "@/shared/api/client";
import { useAuthStore } from "@/shared/auth/auth-store";

let initializationPromise: Promise<void> | null = null;
let hasInitialized = false;

/**
 * Attempt to recover a session from the HttpOnly refresh-token cookie
 * that the backend sets on login/refresh.
 *
 * Called once at app startup, before any route guard runs.
 *
 * Rules (from ARCHITECTURE.md + PROJECT-RULES.md):
 * - access token is memory-first
 * - FE must support session recovery without persisting access tokens
 * - refresh uses `withCredentials: true` so the browser sends the cookie
 * - `skipAuthRefresh: true` prevents the 401 interceptor from creating
 *   an infinite loop during the bootstrap request itself
 */
async function runAuthInitialization(): Promise<void> {
  try {
    await refreshAccessToken();
  } catch {
    // Cookie absent, expired, or revoked — start as anonymous.
    useAuthStore.getState().setStatus("anonymous");
  }
}

export function initializeAuth(): Promise<void> {
  if (hasInitialized) {
    return Promise.resolve();
  }

  initializationPromise ??= runAuthInitialization().finally(() => {
    hasInitialized = true;
    initializationPromise = null;
  });

  return initializationPromise;
}
