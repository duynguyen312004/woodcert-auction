import { afterEach, describe, expect, it, vi } from "vitest";

import { uploadToCloudinary, type CloudinaryUploadIntentRes } from "./cloudinaryUpload";

function createFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

function createIntent(): CloudinaryUploadIntentRes {
  return {
    mediaId: 101,
    uploadUrl: "https://api.cloudinary.com/v1_1/demo/image/upload",
    cloudName: "demo",
    apiKey: "api-key",
    assetFolder: "woodcert/dev/users/user-1/avatar",
    publicId: "woodcert/dev/users/user-1/avatar/101",
    resourceType: "image",
    timestamp: 1775700000,
    signature: "signed",
  };
}

describe("uploadToCloudinary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends signed upload form-data using asset_folder and returns asset_id", async () => {
    const intent = createIntent();
    const file = createFile("avatar.png", "image/png", 1024);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ asset_id: "asset-101" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(uploadToCloudinary(intent, file)).resolves.toBe("asset-101");

    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe(intent.uploadUrl);
    expect(request?.[1]).toMatchObject({ method: "POST" });

    const formData = request?.[1]?.body as FormData;
    expect(formData.get("file")).toBe(file);
    expect(formData.get("api_key")).toBe(intent.apiKey);
    expect(formData.get("timestamp")).toBe(String(intent.timestamp));
    expect(formData.get("signature")).toBe(intent.signature);
    expect(formData.get("public_id")).toBe(intent.publicId);
    expect(formData.get("asset_folder")).toBe(intent.assetFolder);
    expect(formData.get("folder")).toBeNull();
  });

  it("fails when Cloudinary response misses asset_id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      uploadToCloudinary(createIntent(), createFile("avatar.png", "image/png", 1)),
    ).rejects.toThrow("Cloudinary response");
  });
});
