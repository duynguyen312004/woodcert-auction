import type { ReactNode } from "react";
import { Link } from "react-router";

import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";

import { OrderFeeBreakdown } from "./OrderFeeBreakdown";
import { getFulfillmentStatusText, getOrderStatusText } from "../lib/order-labels";
import type { OrderSummary } from "../types";

type OrderRowProps = {
  order: OrderSummary;
  audience: "buyer" | "seller";
  actions?: ReactNode;
  detailTo?: string;
};

export function OrderRow({ order, audience, actions, detailTo }: OrderRowProps) {
  return (
    <article className="light-panel rounded-lg border border-white/10 bg-[#f2eee5] p-5 text-stone-950 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          {order.product?.imageUrl && (
            <img
              src={order.product.imageUrl}
              alt={order.product.title ?? ""}
              className="size-14 shrink-0 rounded-md border border-stone-300 object-cover"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">Đơn #{order.id}</h2>
              <span className="rounded-full border border-stone-300 px-2.5 py-1 text-xs font-bold text-stone-600">
                {getOrderStatusText(order.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Phiên #{order.sourceId} · tạo lúc{" "}
              {order.createdAt ? formatDateTime(order.createdAt) : "—"}
            </p>
            {order.product?.title && (
              <p className="mt-1 truncate text-sm font-semibold text-stone-700">
                {order.product.title}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {detailTo && (
            <Button asChild type="button" size="sm" variant="outline">
              <Link to={detailTo}>Chi tiết</Link>
            </Button>
          )}
          {actions}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <OrderFeeBreakdown
          order={order}
          audience={audience}
          showStatus
          lineClassName="border-stone-300"
        />
        <div className="rounded-md border border-stone-300 bg-[#e9e2d6] p-4 text-sm">
          <p className="font-bold">Vận chuyển</p>
          <p className="mt-2 text-stone-600">
            Trạng thái: {getFulfillmentStatusText(order.fulfillment?.status)}
          </p>
          <p className="mt-1 text-stone-600">
            Mã vận đơn: {order.fulfillment?.trackingCode ?? "—"}
          </p>
          {order.shippingAddress && (
            <p className="mt-2 border-t border-stone-300 pt-2 text-xs leading-relaxed text-stone-600">
              {[
                order.shippingAddress.streetAddress,
                order.shippingAddress.wardName,
                order.shippingAddress.districtName,
                order.shippingAddress.provinceName,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
