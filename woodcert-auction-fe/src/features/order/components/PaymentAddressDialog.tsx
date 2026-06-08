import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Link } from "react-router";

import { useAddresses } from "@/features/account";
import { formatVND } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import type { OrderSummary } from "../types";

export function PaymentAddressDialog({
  order,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  order: OrderSummary | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (addressId: number) => Promise<void>;
}) {
  const addressesQuery = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const addresses = addressesQuery.data ?? [];
  const preferredAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const addressId = addresses.some((address) => address.id === selectedAddressId)
    ? selectedAddressId
    : (preferredAddress?.id ?? null);

  return (
    <Dialog open={order !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Chọn địa chỉ nhận hàng</DialogTitle>
          <DialogDescription>
            Địa chỉ được lưu vào đơn tại thời điểm thanh toán và không đổi theo sổ địa chỉ sau này.
          </DialogDescription>
        </DialogHeader>

        {addressesQuery.isPending ? (
          <div className="flex min-h-32 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <MapPin className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Bạn cần thêm địa chỉ trước khi xác nhận đơn hàng.
            </p>
            <Button asChild className="mt-4">
              <Link to="/account/addresses">Thêm địa chỉ</Link>
            </Button>
          </div>
        ) : (
          <div className="grid max-h-72 gap-3 overflow-y-auto">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={
                  addressId === address.id
                    ? "cursor-pointer rounded-lg border border-primary bg-primary/5 p-4"
                    : "cursor-pointer rounded-lg border border-border bg-background p-4"
                }
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="shipping-address"
                    checked={addressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0 text-sm">
                    <p className="font-bold">
                      {address.receiverName} · {address.phoneNumber}
                      {address.isDefault ? (
                        <span className="ml-2 text-xs font-semibold text-primary">Mặc định</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {[
                        address.streetAddress,
                        address.wardName,
                        address.districtName,
                        address.provinceName,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            type="button"
            disabled={!addressId || isPending}
            onClick={() => addressId && void onConfirm(addressId)}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Xác nhận thanh toán {formatVND(order?.remainingAmount ?? 0)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
