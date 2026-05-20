import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";

import { isApiError } from "@/shared/api/errors";
import { clearAuthSession } from "@/shared/auth/auth-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NotificationCard, useNotification } from "@/shared/ui/notification";
import { authApi } from "../api/auth";
import { resetPasswordSchema, type ResetPasswordCredentials } from "../types";

const REDIRECT_DELAY = 5;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const notification = useNotification();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectIn, setRedirectIn] = useState(REDIRECT_DELAY);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordCredentials>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (status !== "success") return;
    if (redirectIn <= 0) {
      navigate("/auth/login");
      return;
    }
    const id = setTimeout(() => setRedirectIn((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [status, redirectIn, navigate]);

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <XCircle className="w-16 h-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-serif font-bold tracking-tight">Liên kết không hợp lệ</h1>
        <NotificationCard
          tone="error"
          title="Không thể đặt lại mật khẩu"
          description="Liên kết đặt lại mật khẩu này không hợp lệ. Vui lòng yêu cầu lại."
          className="text-left"
        />
        <Button asChild className="w-full text-primary-foreground font-semibold">
          <Link to="/auth/forgot-password">Quên mật khẩu</Link>
        </Button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-serif font-bold tracking-tight">Mật khẩu đã được đặt lại</h1>
        <p className="text-muted-foreground text-sm">
          Mật khẩu mới của bạn đã được lưu. Vui lòng đăng nhập lại.
        </p>
        <p className="text-muted-foreground text-sm">
          Tự động chuyển về trang Đăng nhập sau {redirectIn}s...
        </p>
        <Button asChild className="w-full text-primary-foreground font-semibold">
          <Link to="/auth/login">Đăng nhập ngay</Link>
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-6 text-center">
        <XCircle className="w-16 h-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-serif font-bold tracking-tight">Đặt lại mật khẩu thất bại</h1>
        <NotificationCard
          tone="error"
          title="Không thể lưu mật khẩu mới"
          description={errorMessage}
          className="text-left"
        />
        <Button asChild className="w-full text-primary-foreground font-semibold">
          <Link to="/auth/forgot-password">Yêu cầu liên kết mới</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/auth/login">Quay lại Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordCredentials) => {
    try {
      await authApi.resetPassword(token, data.newPassword);
      clearAuthSession();
      setStatus("success");
      notification.success("Mật khẩu đã được đặt lại", {
        description: "Bạn có thể đăng nhập bằng mật khẩu mới.",
      });
    } catch (error: unknown) {
      if (isApiError(error)) {
        if (
          error.code === "PASSWORD_RESET_TOKEN_INVALID" ||
          error.code === "PASSWORD_RESET_TOKEN_EXPIRED"
        ) {
          setErrorMessage(error.message);
          setStatus("error");
          notification.error("Đặt lại mật khẩu thất bại", {
            description: error.message,
          });
          return;
        }
        setErrorMessage(error.message);
        setStatus("error");
        notification.error("Đặt lại mật khẩu thất bại", {
          description: error.message,
        });
        return;
      }
      const message = "Có lỗi xảy ra. Vui lòng thử lại.";
      setErrorMessage(message);
      setStatus("error");
      notification.error("Đặt lại mật khẩu thất bại", {
        description: message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Đặt lại mật khẩu</h1>
        <p className="text-sm text-muted-foreground">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            {...register("newPassword")}
            className="bg-background/50"
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
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
          XÁC NHẬN MẬT KHẨU MỚI
        </Button>
      </form>
    </div>
  );
}
