import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NotificationCard, useNotification } from "@/shared/ui/notification";
import { authApi } from "../api/auth";
import { forgotPasswordSchema, type ForgotPasswordCredentials } from "../types";

export function ForgotPasswordPage() {
  const notification = useNotification();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordCredentials>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordCredentials) => {
    setSubmitError(null);
    try {
      await authApi.forgotPassword(data.email);
      setSubmitted(true);
      notification.success("Đã gửi liên kết đặt lại mật khẩu", {
        description:
          "Nếu email tồn tại trong hệ thống, liên kết sẽ xuất hiện trong hộp thư của bạn.",
      });
    } catch (error: unknown) {
      if (isApiError(error)) {
        setSubmitError(error.message);
        return;
      }
      setSubmitError("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-serif font-bold tracking-tight">Kiểm tra email của bạn</h1>
        <p className="text-muted-foreground text-sm">
          Nếu địa chỉ email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu. Vui
          lòng kiểm tra hộp thư đến (và thư mục spam).
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/auth/login">Quay lại Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Quên mật khẩu</h1>
        <p className="text-sm text-muted-foreground">
          Nhập email đã đăng ký — chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
        </p>
      </div>

      {submitError && (
        <NotificationCard
          tone="error"
          title="Không thể gửi liên kết"
          description={submitError}
          className="p-3"
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email đăng ký</Label>
          <Input
            id="email"
            type="email"
            placeholder="curator@gmail.com"
            {...register("email")}
            className="bg-background/50"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full mt-6 text-primary-foreground font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          GỬI LIÊN KẾT ĐẶT LẠI
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link to="/auth/login" className="text-primary hover:underline font-semibold">
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}
