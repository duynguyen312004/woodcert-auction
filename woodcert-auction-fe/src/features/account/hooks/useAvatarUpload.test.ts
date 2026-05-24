import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_FILE_SIZE,
  createAvatarUploadIntentPayload,
  validateAvatarFile,
} from "./useAvatarUpload";

function createFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("avatar upload helpers", () => {
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
});
