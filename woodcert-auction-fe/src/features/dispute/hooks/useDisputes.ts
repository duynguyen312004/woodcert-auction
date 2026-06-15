import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { disputeApi } from "../api/disputeApi";
import { isActiveDisputeStatus } from "../constants/disputeLabels";
import type {
  CreateDisputeMessagePayload,
  CreateDisputePayload,
  DisputeResolutionOutcome,
} from "../types";

export const DISPUTE_REFRESH_MS = 10_000;

export function getDisputeRefetchInterval(
  detail: { dispute: { status: Parameters<typeof isActiveDisputeStatus>[0] } } | undefined,
) {
  return detail && isActiveDisputeStatus(detail.dispute.status) ? DISPUTE_REFRESH_MS : false;
}

export function useCurrentDispute(orderId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ["disputes", "current", orderId] as const,
    queryFn: () => disputeApi.getCurrentDispute(orderId as number),
    enabled: enabled && orderId !== undefined,
  });
}

export function useDisputeHistory(orderId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ["disputes", "history", orderId] as const,
    queryFn: () => disputeApi.getDisputeHistory(orderId as number),
    enabled: enabled && orderId !== undefined,
  });
}

export function useDisputeDetail(
  orderId: number | undefined,
  disputeId: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["disputes", "detail", orderId, disputeId] as const,
    queryFn: () => disputeApi.getDisputeDetail(orderId as number, disputeId as number),
    enabled: enabled && orderId !== undefined && disputeId !== undefined,
    refetchInterval: (query) => getDisputeRefetchInterval(query.state.data),
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
      void queryClient.invalidateQueries({ queryKey: ["disputes", "history", dispute.orderId] });
    },
  });
}

export function useCancelDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, disputeId }: { orderId: number; disputeId: number }) =>
      disputeApi.cancelDispute(orderId, disputeId),
    onSuccess: (dispute) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["disputes", "current", dispute.orderId] });
      void queryClient.invalidateQueries({ queryKey: ["disputes", "history", dispute.orderId] });
    },
  });
}

export function useAddParticipantDisputeMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      disputeId,
      payload,
    }: {
      orderId: number;
      disputeId: number;
      payload: CreateDisputeMessagePayload;
    }) => disputeApi.addParticipantMessage(orderId, disputeId, payload),
    onSuccess: (detail) => {
      queryClient.setQueryData(
        ["disputes", "detail", detail.dispute.orderId, detail.dispute.id],
        detail,
      );
      void queryClient.invalidateQueries({
        queryKey: ["disputes", "history", detail.dispute.orderId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["disputes", "current", detail.dispute.orderId],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dispute", detail.dispute.id] });
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
    refetchInterval: (query) => getDisputeRefetchInterval(query.state.data),
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
    message: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: CreateDisputeMessagePayload }) =>
        disputeApi.addAdminMessage(id, payload),
      onSuccess: (detail) => {
        queryClient.setQueryData(["admin", "dispute", detail.dispute.id], detail);
        void queryClient.invalidateQueries({
          queryKey: ["disputes", "detail", detail.dispute.orderId, detail.dispute.id],
        });
      },
    }),
  };
}
