import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";

import { hasAppraiserAuthority } from "@/shared/auth/appraiser-authority";
import { resolveAuthenticatedRedirect } from "@/shared/auth/auth-redirects";
import { useAuthStore } from "@/shared/auth/auth-store";
import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NotificationCard, useNotification } from "@/shared/ui/notification";
import { authApi } from "../api/auth";
import { loginSchema, type LoginCredentials } from "../types";

const loginErrorFields = ["email", "password"] as const;

type SubmitError = { type: "message"; message: string } | { type: "unverified"; email: string };

function getLoginSuccessDescription(accessToken: string, roles?: readonly string[]) {
  if (hasAppraiserAuthority(accessToken, roles)) {
    return "Phiên kiểm định đã sẵn sàng. Bạn sẽ được chuyển đến hàng chờ sản phẩm cần duyệt.";
  }

  return "Phiên làm việc đã sẵn sàng. Bạn có thể tiếp tục đấu giá và quản lý tài khoản.";
}

function applyLoginFieldErrors(
  fieldErrors: Record<string, string> | undefined,
  setFieldError: UseFormSetError<LoginCredentials>,
) {
  let applied = false;

  for (const field of loginErrorFields) {
    const message = fieldErrors?.[field];
    if (message) {
      setFieldError(field, { type: "server", message });
      applied = true;
    }
  }

  return applied;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const notification = useNotification();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname as string | undefined;

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setSubmitError(null);
    try {
      const response = await authApi.login(data);
      setAccessToken(response.accessToken);
      notification.success("Đăng nhập thành công", {
        description: getLoginSuccessDescription(response.accessToken, response.roles),
      });
      const destination = resolveAuthenticatedRedirect({
        accessToken: response.accessToken,
        from,
        roles: response.roles,
      });
      navigate(destination, { replace: true });
    } catch (error: unknown) {
      if (isApiError(error)) {
        if (error.code === "ACCOUNT_UNVERIFIED") {
          setSubmitError({ type: "unverified", email: data.email });
          return;
        }
        const hasFieldErrors = applyLoginFieldErrors(error.fieldErrors, setFieldError);
        setSubmitError(hasFieldErrors ? null : { type: "message", message: error.message });
        return;
      }

      setSubmitError({
        type: "message",
        message: "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Chào mừng trở lại</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-wider">
          Bước vào thế giới tinh hoa của chế tác gỗ
        </p>
      </div>

      {submitError?.type === "message" && (
        <NotificationCard
          tone="error"
          title="Đăng nhập thất bại"
          description={submitError.message}
          className="p-3"
        />
      )}

      {submitError?.type === "unverified" && (
        <NotificationCard
          tone="warning"
          title="Tài khoản chưa xác thực"
          description="Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập."
          className="p-3"
          action={
            <Link
              to={`/auth/verify-pending?email=${encodeURIComponent(submitError.email)}`}
              className="inline-flex rounded-md border border-amber-300/30 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-300/10"
            >
              Gửi lại email xác thực
            </Link>
          }
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email đăng nhập</Label>
          <Input
            id="email"
            type="email"
            placeholder="curator@gmail.com"
            {...register("email")}
            className="bg-background/50"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className="bg-background/50 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full mt-6 text-primary-foreground font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          ĐĂNG NHẬP
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Chưa là thành viên? </span>
        <Link to="/auth/register" className="text-primary hover:underline font-semibold">
          Tạo tài khoản
        </Link>
      </div>
    </div>
  );
}
