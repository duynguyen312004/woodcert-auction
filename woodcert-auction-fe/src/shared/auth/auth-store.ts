import { create } from "zustand";

/**
 * Auth session status.
 *
 * - `loading`       — app boot, silent refresh in progress
 * - `anonymous`     — no valid session (cookie expired / first visit)
 * - `authenticated` — access token available
 */
type AuthStatus = "loading" | "anonymous" | "authenticated";

type AuthState = {
  accessToken: string | null;
  status: AuthStatus;
  setAccessToken: (accessToken: string) => void;
  setStatus: (status: AuthStatus) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  status: "loading",
  setAccessToken: (accessToken) => set({ accessToken, status: "authenticated" }),
  setStatus: (status) => set({ status }),
  clearSession: () => set({ accessToken: null, status: "anonymous" }),
}));

export function getAccessToken() {
  return useAuthStore.getState().accessToken;
}

export function setAccessToken(accessToken: string) {
  useAuthStore.getState().setAccessToken(accessToken);
}

export function clearAuthSession() {
  useAuthStore.getState().clearSession();
}
