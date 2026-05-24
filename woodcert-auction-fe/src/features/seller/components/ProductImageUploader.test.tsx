import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductImageUploader, type UploadedImage } from "./ProductImageUploader";

const uploadMock = vi.fn<(file: File) => Promise<number>>();

vi.mock("../hooks/useProductImageUpload", () => ({
  PRODUCT_IMAGE_ACCEPTED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  PRODUCT_IMAGE_MAX_FILE_SIZE_MB: 10,
  useProductImageUpload: () => uploadMock,
}));

function Harness() {
  const [images, setImages] = useState<UploadedImage[]>([]);

  return (
    <>
      <ProductImageUploader images={images} onChange={setImages} />
      <output data-testid="images">{images.map((image) => image.mediaId).join(",")}</output>
    </>
  );
}

function createFile(name: string) {
  return new File([new Uint8Array(10)], name, { type: "image/webp" });
}

describe("ProductImageUploader", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    vi.spyOn(URL, "createObjectURL").mockImplementation((file) => `blob:${(file as File).name}`);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps previously uploaded images when multiple files finish sequentially", async () => {
    uploadMock.mockResolvedValueOnce(101).mockResolvedValueOnce(102);
    const { container } = render(<Harness />);
    const input = container.querySelector("input[type='file']");

    expect(input).not.toBeNull();
    fireEvent.change(input as HTMLInputElement, {
      target: { files: [createFile("one.webp"), createFile("two.webp")] },
    });

    await waitFor(() => {
      expect(screen.getByTestId("images")).toHaveTextContent("101,102");
    });
  });
});
