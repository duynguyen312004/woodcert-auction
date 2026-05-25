import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import type * as ReactRouter from "react-router";

import { AppraiserQueuePage } from "./AppraiserQueuePage";
import type { AppraisalQueueItem } from "../types";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouter>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/shared/ui/notification", () => ({
  useNotification: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/shared/lib/format", () => ({
  formatDate: (d: string | null) => d ?? "—",
}));

const claimMutateAsync = vi.fn();

vi.mock("@/features/appraisal/hooks/useAppraisalQueue", () => ({
  useAppraisalQueue: vi.fn(),
  useAppraisalMyActive: vi.fn(),
  useAppraisalReviewed: vi.fn(),
  useClaimProduct: () => ({
    mutateAsync: claimMutateAsync,
    isPending: false,
  }),
}));

import {
  useAppraisalQueue,
  useAppraisalMyActive,
} from "@/features/appraisal/hooks/useAppraisalQueue";

function makePaginatedResult(items: AppraisalQueueItem[]) {
  return {
    data: { result: items, meta: { page: 1, pageSize: 10, pages: 1, total: items.length } },
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAppraisalQueue>;
}

function makeQueueItem(overrides: Partial<AppraisalQueueItem> = {}): AppraisalQueueItem {
  return {
    id: 1,
    title: "Gỗ hương đỏ cổ",
    category: { id: 1, name: "Tượng gỗ" },
    material: "Gỗ hương",
    status: "PENDING_APPRAISAL",
    primaryImage: null,
    createdAt: "2026-05-01T00:00:00Z",
    submittedAt: "2026-05-02T00:00:00Z",
    appraisalClaimedBy: null,
    appraisalClaimedAt: null,
    appraisalClaimExpiresAt: null,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AppraiserQueuePage />
    </MemoryRouter>,
  );
}

describe("AppraiserQueuePage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("hiển thị badge 'Chờ kiểm định' và CTA 'Bắt đầu kiểm định' cho sản phẩm PENDING_APPRAISAL", () => {
    const item = makeQueueItem({ id: 10, status: "PENDING_APPRAISAL" });
    vi.mocked(useAppraisalQueue).mockReturnValue(makePaginatedResult([item]));
    vi.mocked(useAppraisalMyActive).mockReturnValue(makePaginatedResult([]));

    renderPage();

    expect(screen.getByText("Chờ kiểm định")).toBeVisible();
    expect(screen.getByRole("button", { name: /bắt đầu kiểm định/i })).toBeVisible();
  });

  it("hiển thị badge 'Claim hết hạn' và CTA 'Nhận lại kiểm định' cho UNDER_APPRAISAL đã hết hạn", () => {
    const expiredAt = new Date(Date.now() - 3600_000).toISOString();
    const item = makeQueueItem({
      id: 20,
      status: "UNDER_APPRAISAL",
      appraisalClaimedBy: "other-appraiser",
      appraisalClaimExpiresAt: expiredAt,
    });
    vi.mocked(useAppraisalQueue).mockReturnValue(makePaginatedResult([item]));
    vi.mocked(useAppraisalMyActive).mockReturnValue(makePaginatedResult([]));

    renderPage();

    expect(screen.getByText("Claim hết hạn")).toBeVisible();
    expect(screen.getByRole("button", { name: /nhận lại kiểm định/i })).toBeVisible();
  });

  it("hiển thị trạng thái empty khi hàng chờ trống", () => {
    vi.mocked(useAppraisalQueue).mockReturnValue(makePaginatedResult([]));
    vi.mocked(useAppraisalMyActive).mockReturnValue(makePaginatedResult([]));

    renderPage();

    expect(screen.getByText("Hiện không có sản phẩm nào đang chờ kiểm định.")).toBeVisible();
  });

  it("hiển thị CTA 'Tiếp tục kiểm định' trên tab Đang kiểm định", async () => {
    const user = userEvent.setup();
    const item = makeQueueItem({
      id: 30,
      status: "UNDER_APPRAISAL",
      appraisalClaimedBy: "me",
      appraisalClaimExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    vi.mocked(useAppraisalQueue).mockReturnValue(makePaginatedResult([]));
    vi.mocked(useAppraisalMyActive).mockReturnValue(makePaginatedResult([item]));

    renderPage();

    await user.click(screen.getByRole("button", { name: /đang kiểm định/i }));

    expect(screen.getByRole("button", { name: /tiếp tục kiểm định/i })).toBeVisible();
  });

  it("hiển thị lỗi tải khi query thất bại", () => {
    vi.mocked(useAppraisalQueue).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAppraisalQueue>);
    vi.mocked(useAppraisalMyActive).mockReturnValue(makePaginatedResult([]));

    renderPage();

    expect(screen.getByText("Không thể tải dữ liệu. Vui lòng thử lại.")).toBeVisible();
  });
});
