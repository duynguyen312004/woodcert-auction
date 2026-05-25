import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import { AppraiserPortalGuard } from "@/app/router/AppraiserPortalGuard";
import { useAuthStore } from "@/shared/auth/auth-store";

const { logoutMock } = vi.hoisted(() => ({
  logoutMock: vi.fn<() => Promise<void>>(),
}));

vi.mock("@/features/auth", () => ({
  authApi: {
    logout: logoutMock,
  },
}));

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={["/appraiser/products"]}>
      <Routes>
        <Route element={<AppraiserPortalGuard />}>
          <Route path="/appraiser/products" element={<h1>Appraiser queue</h1>} />
        </Route>
        <Route path="/" element={<h1>Public home</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppraiserPortalGuard", () => {
  afterEach(() => {
    cleanup();
    logoutMock.mockReset();
    useAuthStore.setState({ accessToken: null, status: "anonymous" });
  });

  it("lets non-appraisers leave the no-permission state by logging out", async () => {
    const user = userEvent.setup();
    logoutMock.mockResolvedValue(undefined);
    useAuthStore.setState({ accessToken: null, status: "authenticated" });
    renderGuard();

    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    expect(useAuthStore.getState().status).toBe("anonymous");
    expect(await screen.findByRole("heading", { name: "Public home" })).toBeVisible();
  });
});
