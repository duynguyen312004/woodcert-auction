import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NotificationCard, useNotification } from "@/shared/ui/notification";
import { authApi } from "../api/auth";
import { registerSchema, type RegisterCredentials } from "../types";

const registerErrorFields = ["fullName", "email", "phoneNumber", "password"] as const;

function applyRegisterFieldErrors(
  fieldErrors: Record<string, string> | undefined,
  setFieldError: UseFormSetError<RegisterCredentials>,
) {
  let applied = false;

  for (const field of registerErrorFields) {
    const message = fieldErrors?.[field];
    if (message) {
      setFieldError(field, { type: "server", message });
      applied = true;
    }
  }

  return applied;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const notification = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterCredentials>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phoneNumber: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterCredentials) => {
    setSubmitError(null);
    try {
      await authApi.register(data);
      notification.success("Tạo tài khoản thành công", {
        description:
          "Chúng tôi đã gửi email xác thực. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.",
      });
      navigate(`/auth/verify-pending?email=${encodeURIComponent(data.email)}`);
    } catch (error: unknown) {
      if (isApiError(error)) {
        const hasFieldErrors = applyRegisterFieldErrors(error.fieldErrors, setFieldError);
        setSubmitError(hasFieldErrors ? null : error.message);
        return;
      }

      setSubmitError("Đăng ký thất bại. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">
          Thành viên Độc quyền
        </p>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Tham gia Cộng đồng</h1>
      </div>

      {submitError && (
        <NotificationCard
          tone="error"
          title="Đăng ký thất bại"
          description={submitError}
          className="p-3"
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Nguyễn Văn A"
            {...register("fullName")}
            className="bg-background/50"
          />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Địa chỉ Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nguyenvana@example.com"
            {...register("email")}
            className="bg-background/50"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Số điện thoại</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="0912345678"
            {...register("phoneNumber")}
            className="bg-background/50"
          />
          {errors.phoneNumber && (
            <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className="bg-background/50"
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            className="bg-background/50"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-6 text-primary-foreground font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          TẠO TÀI KHOẢN
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Đã là thành viên? </span>
        <Link to="/auth/login" className="text-primary hover:underline font-semibold">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}
