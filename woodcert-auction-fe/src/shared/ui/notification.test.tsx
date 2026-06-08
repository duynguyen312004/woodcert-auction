import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { NotificationProvider, useNotification } from "./notification";

function NotifyButton() {
  const notification = useNotification();

  return (
    <button
      type="button"
      onClick={() => notification.error("Wallet balance is too low", { duration: 0 })}
    >
      Show notification
    </button>
  );
}

describe("NotificationProvider", () => {
  it("renders toast notifications above open dialogs without blocking the full viewport", () => {
    render(
      <NotificationProvider>
        <Dialog open>
          <DialogContent>
            <DialogTitle>Payment dialog</DialogTitle>
            <DialogDescription>Confirm payment for the order.</DialogDescription>
            <NotifyButton />
          </DialogContent>
        </Dialog>
      </NotificationProvider>,
    );

    expect(screen.getByRole("dialog")).toHaveClass("z-50");

    fireEvent.click(screen.getByRole("button", { name: /show notification/i }));

    const viewport = document.body.querySelector('[aria-live="polite"]');
    const toast = screen.getByRole("alert");

    expect(viewport).toHaveClass("z-[300]", "pointer-events-none");
    expect(toast).toHaveClass("pointer-events-auto");
  });
});
