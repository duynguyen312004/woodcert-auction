import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { disputeApi } from "../api/disputeApi";
import type { CreateDisputePayload, DisputeResolutionOutcome } from "../types";

export function useCurrentDispute(orderId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ["disputes", "current", orderId] as const,
    queryFn: () => disputeApi.getCurrentDispute(orderId as number),
    enabled: enabled && orderId !== undefined,
  });
}

export function useOpenDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: CreateDisputePayload }) =>
      disputeApi.openDispute(orderId, payload),
    onSuccess: (dispute) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["disputes", "current", dispute.orderId] });
    },
  });
}

export function useAdminDisputes(params?: { status?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: ["admin", "disputes", params] as const,
    queryFn: () => disputeApi.getAdminDisputes(params),
  });
}

export function useAdminDispute(id: number | undefined) {
  return useQuery({
    queryKey: ["admin", "dispute", id] as const,
    queryFn: () => disputeApi.getAdminDispute(id as number),
    enabled: id !== undefined,
  });
}

export function useAdminDisputeMutations() {
  const queryClient = useQueryClient();
  const invalidate = (id?: number) => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] });
    if (id) void queryClient.invalidateQueries({ queryKey: ["admin", "dispute", id] });
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  return {
    review: useMutation({
      mutationFn: disputeApi.markUnderReview,
      onSuccess: (dispute) => invalidate(dispute.id),
    }),
    resolve: useMutation({
      mutationFn: (payload: {
        id: number;
        outcome: DisputeResolutionOutcome;
        resolutionNote?: string;
      }) => disputeApi.resolveDispute(payload),
      onSuccess: (dispute) => invalidate(dispute.id),
    }),
  };
}
