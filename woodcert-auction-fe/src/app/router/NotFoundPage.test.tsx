import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("renders the 404 message and primary destination", () => {
    render(
      <MemoryRouter>
        <NotFoundPage homePath="/seller/dashboard" homeLabel="Về bảng điều khiển" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Về bảng điều khiển" })).toHaveAttribute(
      "href",
      "/seller/dashboard",
    );
  });

  it("returns to the previous route", () => {
    render(
      <MemoryRouter initialEntries={["/previous", "/missing"]} initialIndex={1}>
        <Routes>
          <Route path="/previous" element={<h1>Trang trước</h1>} />
          <Route path="/missing" element={<NotFoundPage homePath="/" homeLabel="Về trang chủ" />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));

    expect(screen.getByRole("heading", { name: "Trang trước" })).toBeVisible();
  });
});
