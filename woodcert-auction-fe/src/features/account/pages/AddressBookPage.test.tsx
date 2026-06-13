import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Address } from "../types";
import { AddressBookPage } from "./AddressBookPage";

const api = vi.hoisted(() => ({
  getAddresses: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  setDefaultAddress: vi.fn(),
  deleteAddress: vi.fn(),
  getProvinces: vi.fn(),
  getDistricts: vi.fn(),
  getWards: vi.fn(),
}));

vi.mock("../api/account", () => ({ accountApi: api }));
vi.mock("@/shared/ui/notification", () => ({
  useNotification: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const addresses: Address[] = [
  {
    id: 1,
    receiverName: "Nguyễn Văn A",
    phoneNumber: "0911222333",
    streetAddress: "Số 10 phố Gỗ",
    provinceCode: "01",
    districtCode: "001",
    wardCode: "00001",
    isDefault: true,
    provinceName: "Hà Nội",
    districtName: "Ba Đình",
    wardName: "Phúc Xá",
  },
  {
    id: 2,
    receiverName: "Trần Văn B",
    phoneNumber: "0988777666",
    streetAddress: "Số 20 phố Mộc",
    provinceCode: "01",
    districtCode: "001",
    wardCode: "00001",
    isDefault: false,
    provinceName: "Hà Nội",
    districtName: "Ba Đình",
    wardName: "Phúc Xá",
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AddressBookPage />
    </QueryClientProvider>,
  );
}

describe("AddressBookPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  function mockQueries() {
    api.getAddresses.mockResolvedValue(addresses);
    api.getProvinces.mockResolvedValue([{ code: "01", name: "Hà Nội" }]);
    api.getDistricts.mockResolvedValue([{ code: "001", provinceCode: "01", name: "Ba Đình" }]);
    api.getWards.mockResolvedValue([{ code: "00001", districtCode: "001", name: "Phúc Xá" }]);
  }

  it("creates an address from the form", async () => {
    mockQueries();
    api.createAddress.mockResolvedValue({ ...addresses[1], id: 3 });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Nguyễn Văn A");
    fireEvent.change(screen.getByLabelText("Người nhận"), { target: { value: "Lê Văn C" } });
    fireEvent.change(screen.getByLabelText("Số điện thoại"), {
      target: { value: "0901234567" },
    });
    fireEvent.change(screen.getByLabelText("Tỉnh hoặc thành phố"), { target: { value: "01" } });
    await waitFor(() => expect(screen.getByLabelText("Quận hoặc huyện")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Quận hoặc huyện"), { target: { value: "001" } });
    await waitFor(() => expect(screen.getByLabelText("Phường hoặc xã")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Phường hoặc xã"), { target: { value: "00001" } });
    fireEvent.change(screen.getByLabelText("Địa chỉ đường"), {
      target: { value: "Số 30 phố Gỗ" },
    });
    await user.click(screen.getByRole("button", { name: "Lưu địa chỉ" }));

    await waitFor(() =>
      expect(api.createAddress).toHaveBeenCalledWith({
        receiverName: "Lê Văn C",
        phoneNumber: "0901234567",
        streetAddress: "Số 30 phố Gỗ",
        provinceCode: "01",
        districtCode: "001",
        wardCode: "00001",
        isDefault: false,
      }),
    );
  });

  it("edits an existing address without changing its default flag", async () => {
    mockQueries();
    api.updateAddress.mockResolvedValue({ ...addresses[0], receiverName: "Nguyễn Văn Mới" });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Nguyễn Văn A");
    await user.click(screen.getAllByRole("button", { name: "Sửa" })[0]!);
    const dialog = screen.getByRole("dialog");
    const receiverInput = within(dialog).getByLabelText("Người nhận");
    fireEvent.change(receiverInput, { target: { value: "Nguyễn Văn Mới" } });
    await user.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() =>
      expect(api.updateAddress).toHaveBeenCalledWith(1, {
        receiverName: "Nguyễn Văn Mới",
        phoneNumber: "0911222333",
        streetAddress: "Số 10 phố Gỗ",
        provinceCode: "01",
        districtCode: "001",
        wardCode: "00001",
      }),
    );
  });

  it("sets a non-default address as default", async () => {
    mockQueries();
    api.setDefaultAddress.mockResolvedValue({ ...addresses[1], isDefault: true });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Đặt mặc định" }));

    await waitFor(() => expect(api.setDefaultAddress).toHaveBeenCalledWith(2));
    expect(screen.getByText("Mặc định")).toBeVisible();
  });

  it("requires confirmation before deleting an address", async () => {
    mockQueries();
    api.deleteAddress.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Nguyễn Văn A");
    await user.click(screen.getAllByRole("button", { name: "Xóa" })[0]!);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Nếu đây là địa chỉ mặc định/)).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Xóa địa chỉ" }));

    await waitFor(() => expect(api.deleteAddress).toHaveBeenCalledWith(1));
  });
});
