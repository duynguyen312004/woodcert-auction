import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AvatarUploadIntent } from "../types";
import {
  AVATAR_MAX_FILE_SIZE,
  createAvatarUploadIntentPayload,
  uploadAvatarFileToCloudinary,
  validateAvatarFile,
} from "./useAvatarUpload";

vi.mock("axios", async (importOriginal) => {
  const actual = (await importOriginal()) as { default: object };

  return {
    ...actual,
    default: {
      ...actual.default,
      post: vi.fn(),
    },
  };
});

const mockedAxiosPost = vi.mocked(axios.post);

function createFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

function createIntent(): AvatarUploadIntent {
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

describe("avatar upload helpers", () => {
  beforeEach(() => {
    mockedAxiosPost.mockReset();
  });

  it("accepts supported image files and builds upload-intent payload", () => {
    const file = createFile("avatar.webp", "image/webp", 1024);

    expect(() => validateAvatarFile(file)).not.toThrow();
    expect(createAvatarUploadIntentPayload(file)).toEqual({
      originalFileName: "avatar.webp",
      contentType: "image/webp",
      fileSize: 1024,
    });
  });

  it("rejects unsupported image types", () => {
    const file = createFile("avatar.gif", "image/gif", 1024);

    expect(() => validateAvatarFile(file)).toThrow("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.");
  });

  it("rejects files above the avatar size limit", () => {
    const file = createFile("avatar.jpg", "image/jpeg", AVATAR_MAX_FILE_SIZE + 1);

    expect(() => validateAvatarFile(file)).toThrow("Ảnh đại diện không được vượt quá 5MB.");
  });

  it("uploads form-data to Cloudinary and returns asset_id", async () => {
    const intent = createIntent();
    const file = createFile("avatar.png", "image/png", 1024);

    mockedAxiosPost.mockResolvedValueOnce({ data: { asset_id: "asset-101" } });

    await expect(uploadAvatarFileToCloudinary(intent, file)).resolves.toBe("asset-101");
    expect(mockedAxiosPost).toHaveBeenCalledWith(intent.uploadUrl, expect.any(FormData), {
      withCredentials: false,
    });

    const formData = mockedAxiosPost.mock.calls[0]?.[1] as FormData;
    expect(formData.get("file")).toBe(file);
    expect(formData.get("api_key")).toBe(intent.apiKey);
    expect(formData.get("timestamp")).toBe(String(intent.timestamp));
    expect(formData.get("signature")).toBe(intent.signature);
    expect(formData.get("public_id")).toBe(intent.publicId);
    expect(formData.get("asset_folder")).toBe(intent.assetFolder);
  });

  it("fails when Cloudinary response misses asset_id", async () => {
    mockedAxiosPost.mockResolvedValueOnce({ data: {} });

    await expect(
      uploadAvatarFileToCloudinary(createIntent(), createFile("avatar.png", "image/png", 1)),
    ).rejects.toThrow("Cloudinary upload response did not include asset_id.");
  });
});
