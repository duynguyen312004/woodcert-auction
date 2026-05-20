import { Loader2, Mail } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { z } from "zod";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NotificationCard, useNotification } from "@/shared/ui/notification";
import { authApi } from "../api/auth";

type ResendStatus = "idle" | "sending" | "sent" | "error";

const COOLDOWN_SECONDS = 60;

const emailSchema = z
  .string()
  .min(1, "Vui lòng nhập email.")
  .email("Vui lòng nhập địa chỉ email hợp lệ.");

export function PendingVerificationPage() {
  const [searchParams] = useSearchParams();
  const notification = useNotification();
  const emailFromUrl = searchParams.get("email") ?? "";
  const hasEmailFromUrl = Boolean(emailFromUrl);

  const [email, setEmail] = useState(emailFromUrl);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(hasEmailFromUrl ? COOLDOWN_SECONDS : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCooldown = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCooldownTimer = useCallback(() => {
    stopCooldown();
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          stopCooldown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopCooldown]);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);
    startCooldownTimer();
  }, [startCooldownTimer]);

  useEffect(() => {
    if (hasEmailFromUrl) {
      startCooldownTimer();
    }
    return stopCooldown;
  }, [hasEmailFromUrl, startCooldownTimer, stopCooldown]);

  const handleResend = async () => {
    setEmailError(null);
    setResendError(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "Email không hợp lệ.");
      return;
    }

    setResendStatus("sending");
    try {
      await authApi.resendVerificationEmail(email);
      setResendStatus("sent");
      notification.success("Email xác thực đã được gửi lại", {
        description: "Vui lòng kiểm tra hộp thư đến và thư mục spam.",
      });
      startCooldown();
    } catch (error: unknown) {
      setResendStatus("error");
      const message = isApiError(error) ? error.message : "Gửi lại thất bại. Vui lòng thử lại sau.";
      setResendError(message);
      notification.error("Không thể gửi lại email", {
        description: message,
      });
    }
  };

  const isCoolingDown = cooldown > 0;
  const canResend = !isCoolingDown && resendStatus !== "sending";

  return (
    <div className="space-y-6 text-center py-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mx-auto">
        <Mail className="w-8 h-8 text-primary" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Kiểm tra Email</h1>
        {hasEmailFromUrl ? (
          <>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Chúng tôi đã gửi liên kết xác thực đến
            </p>
            <p className="text-foreground font-semibold text-sm">{email}</p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Nhập email đã đăng ký để nhận lại liên kết xác thực.
          </p>
        )}
        <p className="text-muted-foreground text-sm">
          Nhấp vào liên kết trong email để kích hoạt tài khoản.
        </p>
      </div>

      {resendStatus === "sent" && (
        <NotificationCard
          tone="success"
          title="Email xác thực đã được gửi lại"
          description="Liên kết mới đã được gửi đến địa chỉ email bạn cung cấp."
          className="p-3 text-left"
        />
      )}

      {resendStatus === "error" && resendError && (
        <NotificationCard
          tone="error"
          title="Gửi lại thất bại"
          description={resendError}
          className="p-3 text-left"
        />
      )}

      <div className="space-y-3 text-left">
        <p className="text-muted-foreground text-sm text-center">
          {isCoolingDown ? `Bạn có thể gửi lại sau ${cooldown} giây` : "Không nhận được email?"}
        </p>

        {!hasEmailFromUrl && (
          <div className="space-y-1.5">
            <Label htmlFor="resend-email">Địa chỉ Email</Label>
            <Input
              id="resend-email"
              type="email"
              placeholder="nguyenvana@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/50"
            />
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full font-semibold"
          onClick={handleResend}
          disabled={!canResend}
        >
          {resendStatus === "sending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCoolingDown ? `Gửi lại sau ${cooldown}s` : "Gửi lại email xác thực"}
        </Button>
      </div>

      <div className="pt-2 border-t border-border">
        <Link
          to="/auth/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}
