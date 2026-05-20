import { useEffect } from "react";

import { refreshAccessToken } from "@/shared/api/client";
import {
  getAccessTokenRefreshDelayMs,
  shouldRefreshAccessToken,
} from "@/shared/auth/access-token-expiry";
import { clearAuthSession, useAuthStore } from "@/shared/auth/auth-store";

export const ACCESS_TOKEN_REFRESH_LEAD_MS = 90_000;

async function refreshOrClearSession() {
  try {
    await refreshAccessToken();
  } catch {
    clearAuthSession();
  }
}

export function AuthSessionEffects() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) {
      return undefined;
    }

    const delayMs = getAccessTokenRefreshDelayMs(
      accessToken,
      Date.now(),
      ACCESS_TOKEN_REFRESH_LEAD_MS,
    );

    if (delayMs === null) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void refreshOrClearSession();
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [accessToken, status]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const currentState = useAuthStore.getState();

      if (currentState.status !== "authenticated" || !currentState.accessToken) {
        return;
      }

      if (
        shouldRefreshAccessToken(currentState.accessToken, Date.now(), ACCESS_TOKEN_REFRESH_LEAD_MS)
      ) {
        void refreshOrClearSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return null;
}
