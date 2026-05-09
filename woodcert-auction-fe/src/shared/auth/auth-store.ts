import { create } from "zustand";

type AuthStatus = "anonymous" | "authenticated";

type AuthState = {
  accessToken: string | null;
  status: AuthStatus;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  status: "anonymous",
  setAccessToken: (accessToken) => set({ accessToken, status: "authenticated" }),
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
