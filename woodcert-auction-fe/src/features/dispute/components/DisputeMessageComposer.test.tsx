import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { disputeApi } from "../api/disputeApi";
import { DisputeMessageComposer } from "./DisputeMessageComposer";

const notification = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("@/shared/ui/notification", () => ({
  useNotification: () => notification,
}));

vi.mock("../api/disputeApi", () => ({
  disputeApi: {
    uploadEvidence: vi.fn(),
  },
}));

function image(name: string) {
  return new File([new Uint8Array(10)], name, { type: "image/webp" });
}

describe("DisputeMessageComposer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, "createObjectURL").mockImplementation((file) => `blob:${(file as File).name}`);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a trimmed text-only response", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DisputeMessageComposer onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Thêm phản hồi"), "  Hàng bị trầy  ");
    await userEvent.click(screen.getByRole("button", { name: /gửi phản hồi/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        content: "Hàng bị trầy",
        evidenceMediaIds: [],
      });
    });
    expect(notification.success).toHaveBeenCalled();
  });

  it("uploads image-only evidence and allows removing a preview before submit", async () => {
    vi.mocked(disputeApi.uploadEvidence).mockResolvedValueOnce(202);
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<DisputeMessageComposer onSubmit={onSubmit} />);
    const input = container.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [image("remove.webp"), image("keep.webp")] },
    });
    await userEvent.click(screen.getByRole("button", { name: "Bỏ ảnh remove.webp" }));
    await userEvent.click(screen.getByRole("button", { name: /gửi phản hồi/i }));

    await waitFor(() => {
      expect(disputeApi.uploadEvidence).toHaveBeenCalledTimes(1);
      expect(disputeApi.uploadEvidence).toHaveBeenCalledWith(
        expect.objectContaining({ name: "keep.webp" }),
      );
      expect(onSubmit).toHaveBeenCalledWith({
        content: undefined,
        evidenceMediaIds: [202],
      });
    });
  });

  it("limits a response to ten images and warns about invalid files", () => {
    const { container } = render(<DisputeMessageComposer onSubmit={vi.fn()} />);
    const input = container.querySelector("input[type='file']") as HTMLInputElement;
    const files = Array.from({ length: 11 }, (_, index) => image(`${index}.webp`));

    fireEvent.change(input, { target: { files } });

    expect(screen.getByText("Thêm ảnh (10/10)")).toBeVisible();
    expect(notification.warning).toHaveBeenCalledWith(
      "Chỉ được đính kèm tối đa 10 ảnh cho mỗi phản hồi.",
    );

    fireEvent.change(input, {
      target: { files: [new File(["not-image"], "proof.txt", { type: "text/plain" })] },
    });
    expect(notification.warning).toHaveBeenCalledWith(
      "Một số tệp không được thêm.",
      expect.objectContaining({ description: expect.stringContaining("10 MB") }),
    );
  });
});
