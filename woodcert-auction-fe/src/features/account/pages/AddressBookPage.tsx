import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { useNotification } from "@/shared/ui/notification";

import { accountApi } from "../api/account";
import { ADDRESSES_QUERY_KEY } from "../hooks/useProfile";
import type { Address, CreateAddressPayload, UpdateAddressPayload } from "../types";

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
  const [createForm, setCreateForm] = useState<CreateAddressPayload>(EMPTY);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editForm, setEditForm] = useState<UpdateAddressPayload | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const queryClient = useQueryClient();
  const notification = useNotification();

  const addressesQuery = useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: accountApi.getAddresses,
  });

  const refreshAddresses = () => queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAddressPayload) => accountApi.createAddress(payload),
    onSuccess: () => {
      setCreateForm(EMPTY);
      void refreshAddresses();
      notification.success("Đã thêm địa chỉ");
    },
    onError: (error) => notifyError(notification, "Không thể thêm địa chỉ", error),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateAddressPayload }) =>
      accountApi.updateAddress(id, payload),
    onSuccess: () => {
      setEditingAddress(null);
      setEditForm(null);
      void refreshAddresses();
      notification.success("Đã cập nhật địa chỉ");
    },
    onError: (error) => notifyError(notification, "Không thể cập nhật địa chỉ", error),
  });

  const defaultMutation = useMutation({
    mutationFn: (addressId: number) => accountApi.setDefaultAddress(addressId),
    onSuccess: () => {
      void refreshAddresses();
      notification.success("Đã đổi địa chỉ mặc định");
    },
    onError: (error) => notifyError(notification, "Không thể đổi địa chỉ mặc định", error),
  });

  const deleteMutation = useMutation({
    mutationFn: (addressId: number) => accountApi.deleteAddress(addressId),
    onSuccess: () => {
      setDeletingAddress(null);
      void refreshAddresses();
      notification.success("Đã xóa địa chỉ");
    },
    onError: (error) => notifyError(notification, "Không thể xóa địa chỉ", error),
  });

  const startEditing = (address: Address) => {
    setEditingAddress(address);
    setEditForm({
      receiverName: address.receiverName,
      phoneNumber: address.phoneNumber,
      streetAddress: address.streetAddress,
      provinceCode: address.provinceCode,
      districtCode: address.districtCode,
      wardCode: address.wardCode,
    });
  };

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
              createMutation.mutate(createForm);
            }}
          >
            <h2 className="font-bold">Thêm địa chỉ giao hàng</h2>
            <AddressFields value={createForm} onChange={setCreateForm} />
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createForm.isDefault}
                onChange={(event) =>
                  setCreateForm({ ...createForm, isDefault: event.target.checked })
                }
              />
              Đặt làm địa chỉ mặc định
            </label>
            <Button type="submit" className="mt-4 w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Lưu địa chỉ
            </Button>
          </form>

          <div className="grid content-start gap-3">
            {addressesQuery.isPending && <AddressState text="Đang tải sổ địa chỉ..." loading />}
            {addressesQuery.isError && <AddressState text="Không thể tải sổ địa chỉ." />}
            {(addressesQuery.data ?? []).map((address) => (
              <article key={address.id} className="rounded-lg border border-border/60 bg-card p-5">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{address.receiverName}</p>
                      {address.isDefault && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{address.phoneNumber}</p>
                    <p className="mt-2 text-sm">
                      {address.streetAddress}, {address.wardName || address.wardCode},{" "}
                      {address.districtName || address.districtCode},{" "}
                      {address.provinceName || address.provinceCode}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {!address.isDefault && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={defaultMutation.isPending}
                          onClick={() => defaultMutation.mutate(address.id)}
                        >
                          <Star className="h-4 w-4" />
                          Đặt mặc định
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(address)}
                      >
                        <Pencil className="h-4 w-4" />
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingAddress(address)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!addressesQuery.isPending &&
              !addressesQuery.isError &&
              (addressesQuery.data ?? []).length === 0 && (
                <AddressState text="Chưa có địa chỉ giao hàng." />
              )}
          </div>
        </section>
      </div>

      <Dialog
        open={editingAddress !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAddress(null);
            setEditForm(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa địa chỉ</DialogTitle>
            <DialogDescription>
              Thay đổi này không ảnh hưởng địa chỉ đã được lưu trong các đơn hàng cũ.
            </DialogDescription>
          </DialogHeader>
          {editingAddress && editForm && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                updateMutation.mutate({ id: editingAddress.id, payload: editForm });
              }}
            >
              <AddressFields value={editForm} onChange={setEditForm} />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={updateMutation.isPending}>
                    Hủy
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingAddress !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingAddress(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa địa chỉ</DialogTitle>
            <DialogDescription>
              Xóa địa chỉ của {deletingAddress?.receiverName}? Nếu đây là địa chỉ mặc định, hệ thống
              sẽ tự chọn địa chỉ còn lại làm mặc định.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={deleteMutation.isPending}>
                Hủy
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={!deletingAddress || deleteMutation.isPending}
              onClick={() => deletingAddress && deleteMutation.mutate(deletingAddress.id)}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Xóa địa chỉ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function AddressFields<T extends UpdateAddressPayload>({
  value,
  onChange,
}: {
  value: T;
  onChange: (value: T) => void;
}) {
  const provincesQuery = useQuery({
    queryKey: ["locations", "provinces"],
    queryFn: accountApi.getProvinces,
  });
  const districtsQuery = useQuery({
    queryKey: ["locations", "districts", value.provinceCode],
    queryFn: () => accountApi.getDistricts(value.provinceCode),
    enabled: Boolean(value.provinceCode),
  });
  const wardsQuery = useQuery({
    queryKey: ["locations", "wards", value.districtCode],
    queryFn: () => accountApi.getWards(value.districtCode),
    enabled: Boolean(value.districtCode),
  });

  return (
    <div className="mt-4 grid gap-3">
      <Input
        aria-label="Người nhận"
        placeholder="Người nhận"
        required
        value={value.receiverName}
        onChange={(event) => onChange({ ...value, receiverName: event.target.value })}
      />
      <Input
        aria-label="Số điện thoại"
        placeholder="Số điện thoại"
        required
        value={value.phoneNumber}
        onChange={(event) => onChange({ ...value, phoneNumber: event.target.value })}
      />
      <select
        aria-label="Tỉnh hoặc thành phố"
        required
        value={value.provinceCode}
        onChange={(event) =>
          onChange({
            ...value,
            provinceCode: event.target.value,
            districtCode: "",
            wardCode: "",
          })
        }
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
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
        aria-label="Quận hoặc huyện"
        required
        value={value.districtCode}
        onChange={(event) => onChange({ ...value, districtCode: event.target.value, wardCode: "" })}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        disabled={!value.provinceCode || districtsQuery.isLoading}
      >
        <option value="">Chọn Quận / Huyện</option>
        {districtsQuery.data?.map((district) => (
          <option key={district.code} value={district.code}>
            {district.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Phường hoặc xã"
        required
        value={value.wardCode}
        onChange={(event) => onChange({ ...value, wardCode: event.target.value })}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        disabled={!value.districtCode || wardsQuery.isLoading}
      >
        <option value="">Chọn Phường / Xã</option>
        {wardsQuery.data?.map((ward) => (
          <option key={ward.code} value={ward.code}>
            {ward.name}
          </option>
        ))}
      </select>
      <Input
        aria-label="Địa chỉ đường"
        placeholder="Địa chỉ đường (Số nhà, tên đường, thôn...)"
        required
        value={value.streetAddress}
        onChange={(event) => onChange({ ...value, streetAddress: event.target.value })}
      />
    </div>
  );
}

function AddressState({ text, loading = false }: { text: string; loading?: boolean }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-10 text-center text-muted-foreground">
      {loading && <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />}
      {text}
    </div>
  );
}

function notifyError(
  notification: ReturnType<typeof useNotification>,
  title: string,
  error: unknown,
) {
  notification.error(title, {
    description: isApiError(error) ? error.message : "Vui lòng kiểm tra lại thông tin.",
  });
}
