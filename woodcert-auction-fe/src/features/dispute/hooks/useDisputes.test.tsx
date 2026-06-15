import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { disputeApi } from "../api/disputeApi";
import type { DisputeDetail } from "../types";
import {
  DISPUTE_REFRESH_MS,
  getDisputeRefetchInterval,
  useAddParticipantDisputeMessage,
} from "./useDisputes";

vi.mock("../api/disputeApi", () => ({
  disputeApi: {
    addParticipantMessage: vi.fn(),
  },
}));

function detail(status: DisputeDetail["dispute"]["status"] = "OPEN"): DisputeDetail {
  return {
    dispute: {
      id: 31,
      orderId: 91,
      fulfillmentId: 17,
      openedByUserId: "buyer-1",
      status,
      reason: "Sai hàng",
      description: null,
      openedAt: "2026-06-02T00:00:00Z",
      resolvedAt: null,
      resolvedByAdminId: null,
      resolutionOutcome: null,
      resolutionNote: null,
      evidence: [],
    },
    messages: [],
  };
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("dispute hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("polls active cases every ten seconds and stops for closed cases", () => {
    expect(getDisputeRefetchInterval(detail("OPEN"))).toBe(DISPUTE_REFRESH_MS);
    expect(getDisputeRefetchInterval(detail("UNDER_REVIEW"))).toBe(DISPUTE_REFRESH_MS);
    expect(getDisputeRefetchInterval(detail("RESOLVED"))).toBe(false);
    expect(getDisputeRefetchInterval(undefined)).toBe(false);
  });

  it("updates detail cache and invalidates participant and admin views after posting", async () => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const response = {
      ...detail(),
      messages: [
        {
          id: 41,
          authorRole: "BUYER" as const,
          content: "Bổ sung",
          createdAt: "2026-06-02T00:10:00Z",
          evidence: [],
        },
      ],
    };
    vi.mocked(disputeApi.addParticipantMessage).mockResolvedValue(response);
    const { result } = renderHook(() => useAddParticipantDisputeMessage(), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        orderId: 91,
        disputeId: 31,
        payload: { content: "Bổ sung", evidenceMediaIds: [] },
      });
    });

    expect(client.getQueryData(["disputes", "detail", 91, 31])).toEqual(response);
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["disputes", "history", 91] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["disputes", "current", 91] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin", "dispute", 31] });
    });
  });
});
