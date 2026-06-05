import { AlertTriangle, Loader2 } from "lucide-react";

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

type AdminConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  reasonValue?: string;
  reasonError?: string;
  reasonPlaceholder?: string;
  onReasonChange?: (value: string) => void;
  onConfirm: () => void;
};

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  isPending = false,
  reasonValue,
  reasonError,
  reasonPlaceholder,
  onReasonChange,
  onConfirm,
}: AdminConfirmDialogProps) {
  const hasReasonField = onReasonChange != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#171511] text-[#f2eee5]">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-red-400/20 bg-red-500/10 text-red-300">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogHeader className="mb-0">
              <DialogTitle className="text-[#f2eee5]">{title}</DialogTitle>
              <DialogDescription className="text-[#c9bda8]">{description}</DialogDescription>
            </DialogHeader>
          </div>
        </div>
        {hasReasonField ? (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-[#a49a88]">
              Lý do
            </label>
            <textarea
              value={reasonValue ?? ""}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder={reasonPlaceholder ?? "Nhập lý do thao tác"}
              className="min-h-24 w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none placeholder:text-[#a49a88] focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              disabled={isPending}
            />
            {reasonError ? (
              <p className="text-xs font-semibold text-red-300">{reasonError}</p>
            ) : null}
          </div>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm" disabled={isPending}>
              Hủy
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
