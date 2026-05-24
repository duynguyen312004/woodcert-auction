/**
 * Hook bọc flow upload ảnh sản phẩm để component chỉ quản lý trạng thái UI.
 */
import { useCallback } from "react";

import { uploadProductImage } from "../api/mediaApi";

export const PRODUCT_IMAGE_MAX_FILE_SIZE_MB = 10;
export const PRODUCT_IMAGE_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const PRODUCT_IMAGE_ACCEPTED_TYPE_SET = new Set<string>(PRODUCT_IMAGE_ACCEPTED_TYPES);

export function validateProductImageFile(file: File) {
  if (!PRODUCT_IMAGE_ACCEPTED_TYPE_SET.has(file.type)) {
    throw new Error("Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP.");
  }

  if (file.size > PRODUCT_IMAGE_MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Ảnh sản phẩm không được vượt quá ${PRODUCT_IMAGE_MAX_FILE_SIZE_MB}MB.`);
  }
}

export function useProductImageUpload() {
  return useCallback(async (file: File) => {
    validateProductImageFile(file);
    return uploadProductImage(file);
  }, []);
}
