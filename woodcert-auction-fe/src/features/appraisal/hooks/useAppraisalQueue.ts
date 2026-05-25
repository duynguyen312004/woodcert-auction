/**
 * Query và mutation hooks cho khu appraiser.
 *
 * Query hooks lấy danh sách sản phẩm theo từng tab: hàng chờ, đang claim, đã xử lý.
 * Mutation hooks thực hiện claim, release và submit, sau đó invalidate cache liên quan.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreateAppraisalPayload } from "../types";
import { appraisalApi } from "../api/appraisal";

const APPRAISER_QUEUE_KEY = ["appraiser", "queue"] as const;
const APPRAISER_ACTIVE_KEY = ["appraiser", "active"] as const;
const APPRAISER_REVIEWED_KEY = ["appraiser", "reviewed"] as const;
const APPRAISER_PRODUCT_KEY = ["appraiser", "product"] as const;

type QueueParams = { page?: number; size?: number };
type ReviewedParams = { page?: number; size?: number; reviewStatus?: "APPRAISED" | "REJECTED" };

export function useAppraisalQueue(params?: QueueParams) {
  return useQuery({
    queryKey: [...APPRAISER_QUEUE_KEY, params] as const,
    queryFn: () => appraisalApi.getQueue(params),
  });
}

export function useAppraisalMyActive(params?: QueueParams) {
  return useQuery({
    queryKey: [...APPRAISER_ACTIVE_KEY, params] as const,
    queryFn: () => appraisalApi.getMyActive(params),
  });
}

export function useAppraisalReviewed(params?: ReviewedParams) {
  return useQuery({
    queryKey: [...APPRAISER_REVIEWED_KEY, params] as const,
    queryFn: () => appraisalApi.getReviewed(params),
  });
}

export function useAppraisalProductDetail(productId: number | undefined) {
  return useQuery({
    queryKey: [...APPRAISER_PRODUCT_KEY, productId] as const,
    queryFn: () => appraisalApi.getProductDetail(productId as number),
    enabled: productId !== undefined,
  });
}

export function useClaimProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => appraisalApi.claimProduct(productId),
    onSuccess: (_data, productId) => {
      void queryClient.invalidateQueries({ queryKey: APPRAISER_QUEUE_KEY });
      void queryClient.invalidateQueries({ queryKey: APPRAISER_ACTIVE_KEY });
      void queryClient.invalidateQueries({ queryKey: [...APPRAISER_PRODUCT_KEY, productId] });
    },
  });
}

export function useReleaseClaimProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => appraisalApi.releaseClaimProduct(productId),
    onSuccess: (_data, productId) => {
      void queryClient.invalidateQueries({ queryKey: APPRAISER_QUEUE_KEY });
      void queryClient.invalidateQueries({ queryKey: APPRAISER_ACTIVE_KEY });
      void queryClient.invalidateQueries({ queryKey: [...APPRAISER_PRODUCT_KEY, productId] });
    },
  });
}

export function useSubmitAppraisalReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: CreateAppraisalPayload }) =>
      appraisalApi.submitAppraisal(productId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: APPRAISER_ACTIVE_KEY });
      void queryClient.invalidateQueries({ queryKey: APPRAISER_REVIEWED_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...APPRAISER_PRODUCT_KEY, variables.productId],
      });
    },
  });
}
