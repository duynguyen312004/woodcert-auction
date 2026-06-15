import { FileUp, Loader2 } from "lucide-react";
import { useState } from "react";

import { disputeApi, useOpenDispute } from "@/features/dispute";
import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useNotification } from "@/shared/ui/notification";

import type { OrderSummary } from "../types";

type OpenDisputeDialogProps = {
  order: OrderSummary | null;
  onOpenChange: (open: boolean) => void;
};

export function OpenDisputeDialog({ order, onOpenChange }: OpenDisputeDialogProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setUploading] = useState(false);
  const openDispute = useOpenDispute();
  const notification = useNotification();

  const reset = () => {
    setReason("");
    setDescription("");
    setFiles([]);
  };

  const submit = async () => {
    if (!order) return;
    if (!reason.trim() || files.length === 0) {
      notification.error("Thiếu thông tin tranh chấp", {
        description: "Vui lòng nhập lý do và đính kèm ít nhất một ảnh bằng chứng.",
      });
      return;
    }

    setUploading(true);
    try {
      const mediaIds = [];
      for (const file of files) {
        mediaIds.push(await disputeApi.uploadEvidence(file));
      }
      await openDispute.mutateAsync({
        orderId: order.id,
        payload: {
          reason: reason.trim(),
          description: description.trim() || undefined,
          evidenceMediaIds: mediaIds,
        },
      });
      notification.success("Đã mở tranh chấp");
      reset();
      onOpenChange(false);
    } catch (error) {
      notification.error("Không thể mở tranh chấp", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={!!order}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      <DialogContent className="bg-[#f2eee5] text-stone-950">
        <DialogHeader>
          <DialogTitle>Mở tranh chấp đơn #{order?.id}</DialogTitle>
          <DialogDescription>
            Tranh chấp sẽ tạm giữ khoản giải ngân cho người bán đến khi quản trị viên xử lý.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dispute-reason">Lý do</Label>
            <Input id="dispute-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dispute-desc">Mô tả</Label>
            <textarea
              id="dispute-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 min-h-24 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <Label htmlFor="dispute-files">Ảnh bằng chứng</Label>
            <Input
              id="dispute-files"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 10))}
            />
            <p className="mt-1 text-xs text-stone-500">{files.length} ảnh đã chọn</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isUploading || openDispute.isPending}
            onClick={() => void submit()}
          >
            {isUploading || openDispute.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            Gửi tranh chấp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
