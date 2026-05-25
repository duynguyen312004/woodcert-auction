import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";

import { PublicAppraiserGuard } from "@/app/router/PublicAppraiserGuard";
import { clearAuthSession, useAuthStore } from "@/shared/auth/auth-store";

function encodeBase64Url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createToken(claims: object) {
  return ["header", encodeBase64Url(claims), "signature"].join(".");
}

function renderGuard(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<PublicAppraiserGuard />}>
          <Route path="/" element={<h1>Public home</h1>} />
          <Route path="/auctions" element={<h1>Public auctions</h1>} />
        </Route>
        <Route path="/appraiser/products" element={<h1>Appraiser queue</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicAppraiserGuard", () => {
  afterEach(() => {
    cleanup();
    clearAuthSession();
  });

  it("redirects authenticated appraisers away from the root page", async () => {
    useAuthStore.setState({
      accessToken: createToken({ roles: ["ROLE_APPRAISER"] }),
      status: "authenticated",
    });

    renderGuard("/");

    expect(await screen.findByRole("heading", { name: "Appraiser queue" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Public home" })).not.toBeInTheDocument();
  });

  it("redirects authenticated appraisers away from public routes", async () => {
    useAuthStore.setState({
      accessToken: createToken({ permissions: ["APPROVE_PRODUCT"] }),
      status: "authenticated",
    });

    renderGuard("/auctions");

    expect(await screen.findByRole("heading", { name: "Appraiser queue" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Public auctions" })).not.toBeInTheDocument();
  });

  it("allows anonymous users to render public routes", () => {
    clearAuthSession();

    renderGuard("/");

    expect(screen.getByRole("heading", { name: "Public home" })).toBeVisible();
  });

  it("allows authenticated non-appraisers to render public routes", () => {
    useAuthStore.setState({
      accessToken: createToken({ roles: ["ROLE_BIDDER"] }),
      status: "authenticated",
    });

    renderGuard("/auctions");

    expect(screen.getByRole("heading", { name: "Public auctions" })).toBeVisible();
  });

  it("does not render public UI while auth initialization is loading", () => {
    useAuthStore.setState({ accessToken: null, status: "loading" });

    renderGuard("/");

    expect(screen.getByText("Đang xác thực phiên làm việc...")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Public home" })).not.toBeInTheDocument();
  });
});
