import type { AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import type { ApiResponse } from "@/shared/api/types";
import { unwrapApiResponse } from "@/shared/api/unwrap";

describe("unwrapApiResponse", () => {
  it("returns business data from the backend ApiResponse wrapper", () => {
    const response = {
      data: {
        statusCode: 200,
        message: "OK",
        data: { id: "auction-1", title: "Certified wood lot" },
        timestamp: "2026-05-09T00:00:00Z",
      },
    } as AxiosResponse<ApiResponse<{ id: string; title: string }>>;

    expect(unwrapApiResponse(response)).toEqual({
      id: "auction-1",
      title: "Certified wood lot",
    });
  });
});
