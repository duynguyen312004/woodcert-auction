import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";
import { z } from "zod";

import { isApiError } from "@/shared/api/errors";
import { cn } from "@/shared/lib/utils";
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
import { NotificationCard, useNotification } from "@/shared/ui/notification";

import { adminAppraiserApi, type AdminUser } from "../api/appraisers";

const humanNameRegex = /^\s*[\p{L}\p{M}][\p{L}\p{M}\s.'-]*\s*$/u;
const vietnamesePhoneRegex = /^\s*(0|\+84)\d{9,10}\s*$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)\S+$/;

const createAppraiserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters"),
  password: z
    .string()
    .min(8, "Password must be between 8 and 72 characters")
    .max(72, "Password must be between 8 and 72 characters")
    .regex(passwordRegex, "Password must contain at least one letter, one digit, and no spaces"),
  fullName: z
    .string()
    .min(2, "Full name must be between 2 and 100 characters")
    .max(100, "Full name must be between 2 and 100 characters")
    .regex(humanNameRegex, "Full name contains invalid characters"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .max(20, "Phone number must not exceed 20 characters")
    .regex(vietnamesePhoneRegex, "Phone number must be a valid Vietnamese phone number"),
});

type CreateAppraiserFormValues = z.infer<typeof createAppraiserSchema>;

type AdminCreateAppraiserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (user: AdminUser) => void;
};

const createAppraiserFields = ["email", "password", "fullName", "phoneNumber"] as const;

function applyCreateAppraiserFieldErrors(
  fieldErrors: Record<string, string> | undefined,
  setFieldError: UseFormSetError<CreateAppraiserFormValues>,
) {
  let applied = false;

  for (const field of createAppraiserFields) {
    const message = fieldErrors?.[field];
    if (message) {
      setFieldError(field, { type: "server", message });
      applied = true;
    }
  }

  return applied;
}

export function AdminCreateAppraiserDialog({
  open,
  onOpenChange,
  onCreated,
}: AdminCreateAppraiserDialogProps) {
  const notification = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAppraiserFormValues>({
    resolver: zodResolver(createAppraiserSchema),
    defaultValues: {
      email: "",
      fullName: "",
      phoneNumber: "",
      password: "",
    },
  });

  const closeDialog = () => {
    reset();
    setSubmitError(null);
    onOpenChange(false);
  };

  const onSubmit = async (values: CreateAppraiserFormValues) => {
    setSubmitError(null);
    try {
      const user = await adminAppraiserApi.create(values);
      notification.success("Đã tạo tài khoản appraiser");
      closeDialog();
      onCreated(user);
    } catch (error: unknown) {
      if (isApiError(error)) {
        const hasFieldErrors = applyCreateAppraiserFieldErrors(error.fieldErrors, setFieldError);
        setSubmitError(hasFieldErrors ? null : error.message);
        return;
      }
      setSubmitError("Không thể tạo appraiser. Vui lòng kiểm tra lại thông tin.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeDialog();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="max-w-md border-white/10 bg-[#171511] text-[#f2eee5]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#f2eee5]">Tạo appraiser mới</DialogTitle>
          <DialogDescription className="text-[#a49a88]">
            Tạo tài khoản kiểm định viên mới với quyền appraiser độc lập.
          </DialogDescription>
        </DialogHeader>

        {submitError ? (
          <NotificationCard
            tone="error"
            title="Không thể tạo appraiser"
            description={submitError}
            className="p-3"
          />
        ) : null}

        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a49a88]">
              Email <span className="text-red-400">*</span>
            </label>
            <Input
              autoComplete="new-email"
              className={cn(
                "border-white/10 bg-[#25221b] text-foreground placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-primary/20",
                errors.email &&
                  "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20",
              )}
              type="email"
              placeholder="appraiser@example.com"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-1 text-xs font-semibold text-red-400">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a49a88]">
              Họ tên <span className="text-red-400">*</span>
            </label>
            <Input
              autoComplete="off"
              className={cn(
                "border-white/10 bg-[#25221b] text-foreground placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-primary/20",
                errors.fullName &&
                  "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20",
              )}
              placeholder="Appraiser One"
              {...register("fullName")}
            />
            {errors.fullName ? (
              <p className="mt-1 text-xs font-semibold text-red-400">{errors.fullName.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a49a88]">
              Số điện thoại <span className="text-red-400">*</span>
            </label>
            <Input
              autoComplete="off"
              className={cn(
                "border-white/10 bg-[#25221b] text-foreground placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-primary/20",
                errors.phoneNumber &&
                  "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20",
              )}
              placeholder="0912345678"
              {...register("phoneNumber")}
            />
            {errors.phoneNumber ? (
              <p className="mt-1 text-xs font-semibold text-red-400">
                {errors.phoneNumber.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a49a88]">
              Mật khẩu tạm thời <span className="text-red-400">*</span>
            </label>
            <Input
              autoComplete="new-password"
              className={cn(
                "border-white/10 bg-[#25221b] text-foreground placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-primary/20",
                errors.password &&
                  "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20",
              )}
              type="password"
              placeholder="woodcert2026"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-1 text-xs font-semibold text-red-400">{errors.password.message}</p>
            ) : null}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/95"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Tạo appraiser
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
