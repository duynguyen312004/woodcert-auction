import { apiClient } from "@/shared/api/client";
import type { ApiResponse, PaginationResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";
import { uploadToCloudinary, type CloudinaryUploadIntentRes } from "@/shared/lib/cloudinaryUpload";

import type { CreateDisputePayload, DisputeCase, DisputeResolutionOutcome } from "../types";

type UploadIntentReq = {
  originalFileName: string;
  contentType: string;
  fileSize: number;
};

async function createEvidenceUploadIntent(
  req: UploadIntentReq,
): Promise<CloudinaryUploadIntentRes> {
  const response = await apiClient.post<ApiResponse<CloudinaryUploadIntentRes>>(
    "/disputes/evidence/upload-intent",
    req,
  );
  return unwrapApiResponse(response);
}

async function confirmEvidenceUpload(req: { mediaId: number; assetId: string }): Promise<void> {
  await apiClient.put("/disputes/evidence/confirm", req);
}

export const disputeApi = {
  uploadEvidence: async (file: File): Promise<number> => {
    const intent = await createEvidenceUploadIntent({
      originalFileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    });
    const assetId = await uploadToCloudinary(intent, file);
    await confirmEvidenceUpload({ mediaId: intent.mediaId, assetId });
    return intent.mediaId;
  },

  openDispute: async (orderId: number, payload: CreateDisputePayload): Promise<DisputeCase> => {
    const response = await apiClient.post<ApiResponse<DisputeCase>>(
      `/orders/${orderId}/disputes`,
      payload,
    );
    return unwrapApiResponse(response);
  },

  getCurrentDispute: async (orderId: number): Promise<DisputeCase | null> => {
    const response = await apiClient.get<ApiResponse<DisputeCase | null>>(
      `/orders/${orderId}/disputes/current`,
    );
    return unwrapApiResponse(response);
  },

  cancelDispute: async (orderId: number, disputeId: number): Promise<DisputeCase> => {
    const response = await apiClient.patch<ApiResponse<DisputeCase>>(
      `/orders/${orderId}/disputes/${disputeId}/cancel`,
    );
    return unwrapApiResponse(response);
  },

  getAdminDisputes: async (params?: {
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PaginationResponse<DisputeCase>> => {
    const response = await apiClient.get<ApiResponse<PaginationResponse<DisputeCase>>>(
      "/admin/disputes",
      { params },
    );
    return unwrapApiResponse(response);
  },

  getAdminDispute: async (id: number): Promise<DisputeCase> => {
    const response = await apiClient.get<ApiResponse<DisputeCase>>(`/admin/disputes/${id}`);
    return unwrapApiResponse(response);
  },

  markUnderReview: async (id: number): Promise<DisputeCase> => {
    const response = await apiClient.patch<ApiResponse<DisputeCase>>(
      `/admin/disputes/${id}/review`,
    );
    return unwrapApiResponse(response);
  },

  resolveDispute: async ({
    id,
    outcome,
    resolutionNote,
  }: {
    id: number;
    outcome: DisputeResolutionOutcome;
    resolutionNote?: string;
  }): Promise<DisputeCase> => {
    const response = await apiClient.patch<ApiResponse<DisputeCase>>(
      `/admin/disputes/${id}/resolve`,
      { outcome, resolutionNote: resolutionNote || null },
    );
    return unwrapApiResponse(response);
  },
};
