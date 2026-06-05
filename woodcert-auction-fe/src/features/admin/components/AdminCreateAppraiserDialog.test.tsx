import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminCreateAppraiserDialog } from "./AdminCreateAppraiserDialog";

const create = vi.fn();
const success = vi.fn();

vi.mock("../api/appraisers", () => ({
  adminAppraiserApi: {
    create: (...args: unknown[]) => create(...args),
  },
}));

vi.mock("@/shared/ui/notification", () => ({
  NotificationCard: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <p>{title}</p>
      {description ? <p>{description}</p> : null}
    </div>
  ),
  useNotification: () => ({ success, error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}));

function fillForm(
  overrides: Partial<Record<"email" | "fullName" | "phone" | "password", string>> = {},
) {
  fireEvent.change(screen.getByPlaceholderText("appraiser@example.com"), {
    target: { value: overrides.email ?? "appraiser@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("Appraiser One"), {
    target: { value: overrides.fullName ?? "Appraiser One" },
  });
  fireEvent.change(screen.getByPlaceholderText("0912345678"), {
    target: { value: overrides.phone ?? "0912345678" },
  });
  fireEvent.change(screen.getByPlaceholderText("woodcert2026"), {
    target: { value: overrides.password ?? "woodcert2026" },
  });
}

function renderDialog() {
  return render(<AdminCreateAppraiserDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} />);
}

describe("AdminCreateAppraiserDialog", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows fullName validation inline for names with digits", async () => {
    renderDialog();
    fillForm({ fullName: "Appraiser 1" });

    fireEvent.click(screen.getByRole("button", { name: /tạo appraiser/i }));

    expect(await screen.findByText("Full name contains invalid characters")).toBeVisible();
    expect(create).not.toHaveBeenCalled();
  });

  it("maps backend field errors into the form", async () => {
    create.mockRejectedValue({
      message: "Validation failed",
      fieldErrors: { email: "Email already exists" },
      isAuthError: false,
    });
    renderDialog();
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: /tạo appraiser/i }));

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(await screen.findByText("Email already exists")).toBeVisible();
    expect(success).not.toHaveBeenCalled();
  });
});
