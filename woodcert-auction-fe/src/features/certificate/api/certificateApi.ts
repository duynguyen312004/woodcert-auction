import { apiClient } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

export interface CertificateVerification {
  certificateCode: string;
  productId: number | null;
  productTitle: string | null;
  description: string | null;
  imageUrls: string[];
  appraisalImageUrls?: string[];
  category: {
    id: number;
    name: string;
    slug: string;
    parentId: number | null;
    description: string | null;
  } | null;
  material: string | null;
  verifiedMaterial: string;
  origin: string | null;
  ageEstimation: string | null;
  conditionGrade: string | null;
  estimatedValue: number | string;
  authentic: boolean;
  integrityHash: string;
  appraisedAt: string;
  dimensions: string | null;
  weight: number | null;
  sellerName: string | null;
  appraiserName: string | null;
}

export const certificateApi = {
  verify: async (certificateCode: string): Promise<CertificateVerification> => {
    const response = await apiClient.get<ApiResponse<CertificateVerification>>(
      `/certificates/${encodeURIComponent(certificateCode)}`,
    );
    const data = unwrapApiResponse(response);
    return { ...data, estimatedValue: Number(data.estimatedValue) };
  },
};
