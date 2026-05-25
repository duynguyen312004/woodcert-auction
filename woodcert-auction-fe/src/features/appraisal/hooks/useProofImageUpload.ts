/**
 * Hook upload ảnh kiểm định cho appraiser.
 *
 * Thực hiện 3 bước: validate → upload Cloudinary (qua intent BE) → confirm.
 * Trả về mediaId để đính kèm vào payload nộp báo cáo.
 */
import { useCallback } from "react";

import { appraisalApi } from "../api/appraisal";

export const PROOF_IMAGE_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PROOF_IMAGE_MAX_MB = 10;

const PROOF_IMAGE_ACCEPTED_TYPE_SET = new Set<string>(PROOF_IMAGE_ACCEPTED_TYPES);

export function validateProofImageFile(file: File) {
  if (!PROOF_IMAGE_ACCEPTED_TYPE_SET.has(file.type)) {
    throw new Error("Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP.");
  }

  if (file.size > PROOF_IMAGE_MAX_MB * 1024 * 1024) {
    throw new Error(`Ảnh không được vượt quá ${PROOF_IMAGE_MAX_MB}MB.`);
  }
}

export function useProofImageUpload() {
  return useCallback(async (file: File): Promise<number> => {
    validateProofImageFile(file);
    return appraisalApi.uploadProofImage(file);
  }, []);
}
