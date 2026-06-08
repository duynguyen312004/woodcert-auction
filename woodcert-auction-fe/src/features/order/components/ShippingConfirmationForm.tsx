import { Loader2, PackageCheck, Truck, UserCheck } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import type { ConfirmShippingPayload, DeliveryMethod } from "../types";

type ShippingConfirmationFormProps = {
  isPending?: boolean;
  onSubmit: (payload: ConfirmShippingPayload) => Promise<void> | void;
};

export function ShippingConfirmationForm({
  isPending = false,
  onSubmit,
}: ShippingConfirmationFormProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("THIRD_PARTY");
  const [carrierName, setCarrierName] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isThirdParty = deliveryMethod === "THIRD_PARTY";

  const submit = async () => {
    const normalizedCarrierName = carrierName.trim();
    const normalizedTrackingCode = trackingCode.trim();

    if (isThirdParty && (!normalizedCarrierName || !normalizedTrackingCode)) {
      setError("Cần nhập đơn vị vận chuyển và mã vận đơn.");
      return;
    }

    setError(null);
    try {
      await onSubmit({
        deliveryMethod,
        carrierName: isThirdParty ? normalizedCarrierName : undefined,
        trackingCode: normalizedTrackingCode || undefined,
      });
    } catch {
      return;
    }
    setCarrierName("");
    setTrackingCode("");
    setDeliveryMethod("THIRD_PARTY");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-md border border-[#4e4637]/15 bg-[#F6F0E6]/70 p-1">
        <MethodButton
          active={deliveryMethod === "THIRD_PARTY"}
          icon={<Truck className="size-4" />}
          label="Đơn vị vận chuyển"
          onClick={() => setDeliveryMethod("THIRD_PARTY")}
        />
        <MethodButton
          active={deliveryMethod === "SELF_DELIVERY"}
          icon={<UserCheck className="size-4" />}
          label="Tự giao"
          onClick={() => setDeliveryMethod("SELF_DELIVERY")}
        />
      </div>

      {isThirdParty && (
        <div className="grid gap-3">
          <Input
            value={carrierName}
            maxLength={120}
            placeholder="Đơn vị vận chuyển"
            onChange={(event) => setCarrierName(event.target.value)}
          />
          <Input
            value={trackingCode}
            maxLength={120}
            placeholder="Mã vận đơn"
            onChange={(event) => setTrackingCode(event.target.value)}
          />
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <Button
        type="button"
        className="w-full bg-ink-blue text-white hover:bg-ink-blue/90"
        disabled={isPending}
        onClick={() => void submit()}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PackageCheck className="size-4" />
        )}
        Xác nhận giao hàng
      </Button>
    </div>
  );
}

function MethodButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-white px-3 text-xs font-bold text-ink-blue shadow-sm"
          : "inline-flex h-10 items-center justify-center gap-2 rounded-sm px-3 text-xs font-bold text-muted-warm transition-colors hover:bg-white/70 hover:text-ink-blue"
      }
    >
      {icon}
      {label}
    </button>
  );
}
