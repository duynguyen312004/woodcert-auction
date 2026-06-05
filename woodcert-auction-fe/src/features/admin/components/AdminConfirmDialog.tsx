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
  onConfirm: () => void;
};

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  isPending = false,
  onConfirm,
}: AdminConfirmDialogProps) {
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
