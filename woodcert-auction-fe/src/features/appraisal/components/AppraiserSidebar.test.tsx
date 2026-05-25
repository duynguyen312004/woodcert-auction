import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import { AppraiserSidebar } from "@/features/appraisal/components/AppraiserSidebar";
import { setAccessToken, useAuthStore } from "@/shared/auth/auth-store";

const { logoutMock } = vi.hoisted(() => ({
  logoutMock: vi.fn<() => Promise<void>>(),
}));

vi.mock("@/features/account", () => ({
  useProfile: () => ({
    data: {
      avatarUrl: null,
      email: "appraiser@example.com",
      fullName: "Appraiser User",
    },
  }),
}));

vi.mock("@/features/auth", () => ({
  authApi: {
    logout: logoutMock,
  },
}));

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/appraiser/products"]}>
      <Routes>
        <Route path="/appraiser/products" element={<AppraiserSidebar />} />
        <Route path="/" element={<h1>Logged out home</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppraiserSidebar", () => {
  afterEach(() => {
    cleanup();
    logoutMock.mockReset();
    useAuthStore.setState({ accessToken: null, status: "anonymous" });
  });

  it("shows a direct logout action at the bottom of the sidebar", () => {
    renderSidebar();

    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
  });

  it("logs out, clears the session, and navigates home", async () => {
    const user = userEvent.setup();
    logoutMock.mockResolvedValue(undefined);
    setAccessToken("current-token");
    renderSidebar();

    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    expect(useAuthStore.getState().status).toBe("anonymous");
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(await screen.findByRole("heading", { name: "Logged out home" })).toBeVisible();
  });
});
