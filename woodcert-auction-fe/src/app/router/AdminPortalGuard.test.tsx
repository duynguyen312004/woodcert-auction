import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import { AdminPortalGuard } from "@/app/router/AdminPortalGuard";
import { useAuthStore } from "@/shared/auth/auth-store";

function createToken(claims: Record<string, unknown>) {
  const payload = window
    .btoa(JSON.stringify(claims))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.signature`;
}

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={["/admin/revenue"]}>
      <Routes>
        <Route element={<AdminPortalGuard />}>
          <Route path="/admin/revenue" element={<h1>Admin revenue</h1>} />
        </Route>
        <Route path="/" element={<h1>Public home</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminPortalGuard", () => {
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ accessToken: null, status: "anonymous" });
  });

  it("allows users with ADMIN_ACCESS permission", () => {
    useAuthStore.setState({
      accessToken: createToken({ permissions: ["ADMIN_ACCESS"] }),
      status: "authenticated",
    });

    renderGuard();

    expect(screen.getByRole("heading", { name: "Admin revenue" })).toBeVisible();
  });

  it("allows users with ROLE_ADMIN role", () => {
    useAuthStore.setState({
      accessToken: createToken({ roles: ["ROLE_ADMIN"] }),
      status: "authenticated",
    });

    renderGuard();

    expect(screen.getByRole("heading", { name: "Admin revenue" })).toBeVisible();
  });

  it("blocks authenticated users without admin authority", () => {
    useAuthStore.setState({
      accessToken: createToken({ roles: ["ROLE_BIDDER"], permissions: ["JOIN_AUCTION"] }),
      status: "authenticated",
    });

    renderGuard();

    expect(screen.getByRole("heading", { name: "Không có quyền truy cập" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Admin revenue" })).not.toBeInTheDocument();
  });
});
