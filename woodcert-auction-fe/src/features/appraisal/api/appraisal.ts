/**
 * API cho khu appraiser: queue, claim, release, submit và upload ảnh chứng minh.
 */
import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";
import { uploadToCloudinary, type CloudinaryUploadIntentRes } from "@/shared/lib/cloudinaryUpload";

import type {
  AppraisalProductDetail,
  AppraisalQueueItem,
  AppraisalSubmitResult,
  CreateAppraisalPayload,
} from "../types";

type AppraisalQueueParams = {
  page?: number;
  size?: number;
  status?: string;
};

type GetUploadIntentReq = {
  originalFileName: string;
  contentType: string;
  fileSize: number;
};

type ConfirmUploadReq = {
  mediaId: number;
  assetId: string;
};

async function getAppraisalImageUploadIntent(
  req: GetUploadIntentReq,
): Promise<CloudinaryUploadIntentRes> {
  const response = await apiClient.post<ApiResponse<CloudinaryUploadIntentRes>>(
    "/appraisals/images/upload-intent",
    req,
  );
  return unwrapApiResponse(response);
}

async function confirmAppraisalImageUpload(req: ConfirmUploadReq): Promise<void> {
  await apiClient.put("/appraisals/images/confirm", req);
}

export const appraisalApi = {
  getQueue: async (
    params?: AppraisalQueueParams,
  ): Promise<PaginationResponse<AppraisalQueueItem>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<AppraisalQueueItem>>>(
      "/products",
      { params: { ...params, status: "PENDING_APPRAISAL" } },
    );
    return unwrapApiResponse(response);
  },

  getMyActive: async (
    params?: AppraisalQueueParams,
  ): Promise<PaginationResponse<AppraisalQueueItem>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<AppraisalQueueItem>>>(
      "/products",
      { params: { ...params, status: "UNDER_APPRAISAL" } },
    );
    return unwrapApiResponse(response);
  },

  getReviewed: async (
    params?: AppraisalQueueParams & { reviewStatus?: "APPRAISED" | "REJECTED" },
  ): Promise<PaginationResponse<AppraisalQueueItem>> => {
    const { reviewStatus, ...rest } = params ?? {};
    const response = await apiClient.get<ApiResponse<PaginationResponse<AppraisalQueueItem>>>(
      "/products",
      { params: { ...rest, status: reviewStatus ?? "APPRAISED" } },
    );
    return unwrapApiResponse(response);
  },

  getProductDetail: async (productId: number): Promise<AppraisalProductDetail> => {
    const response = await apiClient.get<ApiResponse<AppraisalProductDetail>>(
      `/products/${productId}`,
    );
    return unwrapApiResponse(response);
  },

  claimProduct: async (productId: number): Promise<AppraisalProductDetail> => {
    const response = await apiClient.post<ApiResponse<AppraisalProductDetail>>(
      `/products/${productId}/appraisal-claim`,
    );
    return unwrapApiResponse(response);
  },

  releaseClaimProduct: async (productId: number): Promise<AppraisalProductDetail> => {
    const response = await apiClient.delete<ApiResponse<AppraisalProductDetail>>(
      `/products/${productId}/appraisal-claim`,
    );
    return unwrapApiResponse(response);
  },

  submitAppraisal: async (
    productId: number,
    payload: CreateAppraisalPayload,
  ): Promise<AppraisalSubmitResult> => {
    const response = await apiClient.post<ApiResponse<AppraisalSubmitResult>>(
      `/products/${productId}/appraise`,
      payload,
    );
    return unwrapApiResponse(response);
  },

  uploadProofImage: async (file: File): Promise<number> => {
    const intent = await getAppraisalImageUploadIntent({
      originalFileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    });

    const assetId = await uploadToCloudinary(intent, file);

    await confirmAppraisalImageUpload({ mediaId: intent.mediaId, assetId });

    return intent.mediaId;
  },
};
