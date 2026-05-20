import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { NotificationCard } from "@/shared/ui/notification";
import { authApi } from "../api/auth";

const REDIRECT_DELAY = 3;
const verificationRequests = new Map<string, Promise<void>>();

function verifyEmailOnce(token: string) {
  const existingRequest = verificationRequests.get(token);
  if (existingRequest) {
    return existingRequest;
  }

  const request = authApi.verifyEmail(token).finally(() => {
    verificationRequests.delete(token);
  });
  verificationRequests.set(token, request);
  return request;
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [errorMessage, setErrorMessage] = useState(token ? "" : "Không tìm thấy mã xác thực.");
  const [redirectIn, setRedirectIn] = useState(REDIRECT_DELAY);
  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const verifyToken = async () => {
      try {
        await verifyEmailOnce(token);
        if (isMounted) setStatus("success");
      } catch (error: unknown) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(
            isApiError(error)
              ? error.message
              : "Xác thực thất bại. Mã xác thực có thể không hợp lệ hoặc đã hết hạn.",
          );
        }
      }
    };

    void verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;
    if (redirectIn <= 0) {
      navigate("/auth/login");
      return;
    }
    const id = setTimeout(() => setRedirectIn((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [status, redirectIn, navigate]);

  return (
    <div className="space-y-6 text-center py-6">
      {status === "loading" && (
        <>
          <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
          <h1 className="text-2xl font-serif font-bold tracking-tight">
            Đang xác thực danh tính...
          </h1>
          <p className="text-muted-foreground text-sm">
            Vui lòng chờ trong khi chúng tôi xác nhận quyền truy cập của bạn.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-serif font-bold tracking-tight">Xác thực thành công</h1>
          <p className="text-muted-foreground text-sm">
            Email của bạn đã được xác thực. Bạn có thể bắt đầu đăng nhập.
          </p>
          <p className="text-muted-foreground text-sm">
            Tự động chuyển về trang Đăng nhập sau {redirectIn}s...
          </p>
          <Button asChild className="w-full mt-6 text-primary-foreground font-semibold">
            <Link to="/auth/login">Tiến tới Đăng nhập</Link>
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-serif font-bold tracking-tight">Xác thực thất bại</h1>
          <NotificationCard
            tone="error"
            title="Không thể xác thực email"
            description={errorMessage}
            className="text-left"
          />
          <Button asChild className="w-full mt-6 text-primary-foreground font-semibold">
            <Link to="/auth/verify-pending">Gửi lại email xác thực</Link>
          </Button>
          <Button
            asChild
            className="w-full text-primary-foreground font-semibold"
            variant="outline"
          >
            <Link to="/auth/login">Quay lại Đăng nhập</Link>
          </Button>
        </>
      )}
    </div>
  );
}
