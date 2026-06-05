import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

import type { AdminUser } from "../api/users";
import { AdminUsersPage } from "./AdminUsersPage";

const getUsers = vi.fn();
const ban = vi.fn();
const unban = vi.fn();

vi.mock("../api/users", () => ({
  adminUserApi: {
    getUsers: (...args: unknown[]) => getUsers(...args),
    ban: (...args: unknown[]) => ban(...args),
    unban: (...args: unknown[]) => unban(...args),
  },
}));

vi.mock("@/shared/ui/notification", () => ({
  useNotification: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/shared/lib/format", () => ({
  formatDateTime: (value: string | undefined) => value ?? "—",
}));

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "u-1",
    email: "buyer@example.com",
    fullName: "Nguyễn Văn A",
    phoneNumber: "0912345678",
    status: "ACTIVE",
    roles: ["ROLE_BIDDER"],
    createdAt: "2026-05-25T10:00:00Z",
    ...overrides,
  };
}

function paginated(users: AdminUser[], total = users.length) {
  return {
    meta: { page: 1, pageSize: 20, pages: 1, total },
    result: users,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AdminUsersPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders user list from API", async () => {
    getUsers.mockResolvedValue(paginated([makeUser()]));

    renderPage();

    expect(await screen.findByText("Nguyễn Văn A")).toBeVisible();
    expect(screen.getByText("buyer@example.com")).toBeVisible();
  });

  it("bans an active user after confirming the dialog", async () => {
    getUsers.mockResolvedValue(paginated([makeUser()]));
    ban.mockResolvedValue(makeUser({ status: "BANNED" }));

    renderPage();

    const banButton = await screen.findByRole("button", { name: /^khóa$/i });
    fireEvent.click(banButton);

    const confirmButton = await screen.findByRole("button", { name: /khóa tài khoản/i });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(ban).toHaveBeenCalled());
    expect(ban.mock.calls.at(0)?.[0]).toBe("u-1");
  });

  it("unbans a banned user", async () => {
    getUsers.mockResolvedValue(paginated([makeUser({ status: "BANNED" })]));
    unban.mockResolvedValue(makeUser({ status: "ACTIVE" }));

    renderPage();

    const unbanButton = await screen.findByRole("button", { name: /mở khóa/i });
    fireEvent.click(unbanButton);

    const confirmButton = await screen.findByRole("button", { name: /^mở khóa$/i });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(unban).toHaveBeenCalled());
    expect(unban.mock.calls.at(0)?.[0]).toBe("u-1");
  });
});
