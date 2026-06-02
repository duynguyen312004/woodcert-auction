import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useNotification } from "@/shared/ui/notification";

import { accountApi } from "../api/account";
import type { CreateAddressPayload } from "../types";

const EMPTY: CreateAddressPayload = {
  receiverName: "",
  phoneNumber: "",
  streetAddress: "",
  provinceCode: "",
  districtCode: "",
  wardCode: "",
  isDefault: false,
};

export function AddressBookPage() {
  const [form, setForm] = useState<CreateAddressPayload>(EMPTY);
  const queryClient = useQueryClient();
  const notification = useNotification();

  const addressesQuery = useQuery({
    queryKey: ["account", "addresses"],
    queryFn: accountApi.getAddresses,
  });

  // Fetch provinces list
  const provincesQuery = useQuery({
    queryKey: ["locations", "provinces"],
    queryFn: accountApi.getProvinces,
  });

  // Fetch districts list based on selected provinceCode
  const districtsQuery = useQuery({
    queryKey: ["locations", "districts", form.provinceCode],
    queryFn: () => accountApi.getDistricts(form.provinceCode),
    enabled: !!form.provinceCode,
  });

  // Fetch wards list based on selected districtCode
  const wardsQuery = useQuery({
    queryKey: ["locations", "wards", form.districtCode],
    queryFn: () => accountApi.getWards(form.districtCode),
    enabled: !!form.districtCode,
  });

  const createMutation = useMutation({
    mutationFn: accountApi.createAddress,
    onSuccess: () => {
      setForm(EMPTY);
      void queryClient.invalidateQueries({ queryKey: ["account", "addresses"] });
      notification.success("Đã thêm địa chỉ");
    },
    onError: (error) =>
      notification.error("Không thể thêm địa chỉ", {
        description: isApiError(error) ? error.message : "Vui lòng kiểm tra lại thông tin.",
      }),
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1080px] space-y-6">
        <header className="border-b border-border/40 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Account</p>
          <h1 className="mt-1 text-3xl font-bold">Sổ địa chỉ</h1>
        </header>
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form
            className="rounded-lg border border-border/60 bg-card p-5"
            onSubmit={(event) => {
              event.preventDefault();
              void createMutation.mutateAsync(form);
            }}
          >
            <h2 className="font-bold">Thêm địa chỉ giao hàng</h2>
            <div className="mt-4 grid gap-3">
              <Input
                placeholder="Người nhận"
                value={form.receiverName}
                onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
              />
              <Input
                placeholder="Số điện thoại"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
              <select
                value={form.provinceCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setForm({
                    ...form,
                    provinceCode: code,
                    districtCode: "",
                    wardCode: "",
                  });
                }}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent pl-3 pr-8 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>option]:bg-background [&>option]:text-foreground cursor-pointer"
                disabled={provincesQuery.isLoading}
              >
                <option value="">Chọn Tỉnh / Thành phố</option>
                {provincesQuery.data?.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>

              <select
                value={form.districtCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setForm({
                    ...form,
                    districtCode: code,
                    wardCode: "",
                  });
                }}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent pl-3 pr-8 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>option]:bg-background [&>option]:text-foreground cursor-pointer"
                disabled={!form.provinceCode || districtsQuery.isLoading}
              >
                <option value="">Chọn Quận / Huyện</option>
                {districtsQuery.data?.map((district) => (
                  <option key={district.code} value={district.code}>
                    {district.name}
                  </option>
                ))}
              </select>

              <select
                value={form.wardCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setForm({ ...form, wardCode: code });
                }}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent pl-3 pr-8 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>option]:bg-background [&>option]:text-foreground cursor-pointer"
                disabled={!form.districtCode || wardsQuery.isLoading}
              >
                <option value="">Chọn Phường / Xã</option>
                {wardsQuery.data?.map((ward) => (
                  <option key={ward.code} value={ward.code}>
                    {ward.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Địa chỉ đường (Số nhà, tên đường, thôn...)"
                value={form.streetAddress}
                onChange={(e) => setForm({ ...form, streetAddress: e.target.value })}
              />
            </div>
            <Button type="submit" className="mt-4 w-full" disabled={createMutation.isPending}>
              <Plus className="h-4 w-4" />
              Lưu địa chỉ
            </Button>
          </form>
          <div className="grid gap-3">
            {(addressesQuery.data ?? []).map((address) => (
              <article key={address.id} className="rounded-lg border border-border/60 bg-card p-5">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-bold">{address.receiverName}</p>
                    <p className="text-sm text-muted-foreground">{address.phoneNumber}</p>
                    <p className="mt-2 text-sm">
                      {address.streetAddress}, {address.wardName || address.wardCode},{" "}
                      {address.districtName || address.districtCode},{" "}
                      {address.provinceName || address.provinceCode}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {(addressesQuery.data ?? []).length === 0 && (
              <div className="rounded-lg border border-border/60 bg-card p-10 text-center text-muted-foreground">
                Chưa có địa chỉ giao hàng.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
