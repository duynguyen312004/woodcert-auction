import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProofImageUploader, type ProofImage } from "./ProofImageUploader";

const uploadMock = vi.fn<(file: File) => Promise<number>>();

vi.mock("../hooks/useProofImageUpload", () => ({
  PROOF_IMAGE_ACCEPTED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  PROOF_IMAGE_MAX_MB: 10,
  useProofImageUpload: () => uploadMock,
}));

function Harness() {
  const [images, setImages] = useState<ProofImage[]>([]);

  return (
    <>
      <ProofImageUploader images={images} onChange={setImages} />
      <output data-testid="payload">
        {JSON.stringify(images.map(({ mediaId, description }) => ({ mediaId, description })))}
      </output>
    </>
  );
}

function createFile(name: string) {
  return new File([new Uint8Array(10)], name, { type: "image/webp" });
}

describe("ProofImageUploader", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    vi.spyOn(URL, "createObjectURL").mockImplementation((file) => `blob:${(file as File).name}`);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps an editable description for submitted proof images", async () => {
    const user = userEvent.setup();
    uploadMock.mockResolvedValueOnce(501);
    const { container } = render(<Harness />);
    const input = container.querySelector("input[type='file']");

    expect(input).not.toBeNull();
    fireEvent.change(input as HTMLInputElement, {
      target: { files: [createFile("grain.webp")] },
    });

    const description = await screen.findByPlaceholderText("Mô tả bằng chứng");
    await user.type(description, "End-grain close-up");

    await waitFor(() => {
      expect(screen.getByTestId("payload")).toHaveTextContent(
        JSON.stringify([{ mediaId: 501, description: "End-grain close-up" }]),
      );
    });
  });
});
