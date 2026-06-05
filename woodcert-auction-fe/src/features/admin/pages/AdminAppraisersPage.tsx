import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  UserRoundCheck,
} from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { formatDateTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useNotification } from "@/shared/ui/notification";
import { Pagination } from "@/shared/ui/pagination";

import { adminAppraiserApi } from "../api/appraisers";
import { adminUserApi, type AdminUser } from "../api/users";
import { AdminConfirmDialog } from "../components/AdminConfirmDialog";
import { AdminEmptyState } from "../components/AdminEmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

// Regex số điện thoại Việt Nam chuẩn
const vietnamesePhoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

// Schema Zod cho validation form tạo Appraiser
const appraiserFormSchema = z.object({
  email: z.string().min(1, "Email không được để trống").email("Email không đúng định dạng"),
  fullName: z
    .string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên không được vượt quá 100 ký tự"),
  phoneNumber: z
    .string()
    .min(1, "Số điện thoại không được để trống")
    .regex(vietnamesePhoneRegex, "Số điện thoại Việt Nam không hợp lệ (ví dụ: 0912345678)"),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(50, "Mật khẩu không được vượt quá 50 ký tự"),
});

type AppraiserFormValues = z.infer<typeof appraiserFormSchema>;

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "Đang hoạt động",
    BANNED: "Đã khóa",
    UNVERIFIED: "Chưa xác minh",
  };
  return labels[status] ?? status;
}

export function AdminAppraisersPage() {
  const [queryText, setQueryText] = useState("");
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<{
    user: AdminUser;
    type: "ban" | "unban";
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const notification = useNotification();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppraiserFormValues>({
    resolver: zodResolver(appraiserFormSchema),
    defaultValues: {
      email: "",
      fullName: "",
      phoneNumber: "",
      password: "",
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "appraisers", { queryText, page }],
    queryFn: () =>
      adminUserApi.getUsers({
        role: "ROLE_APPRAISER",
        query: queryText || undefined,
        page,
        size: 20,
      }),
  });

  // Lấy số lượng appraiser đang active từ server (chính xác, không phụ thuộc trang hiện tại)
  const activeCountQuery = useQuery({
    queryKey: ["admin", "appraisers", "count", "active"],
    queryFn: () => adminUserApi.getUsers({ role: "ROLE_APPRAISER", status: "ACTIVE", size: 1 }),
  });

  const createMutation = useMutation({
    mutationFn: adminAppraiserApi.create,
    onSuccess: () => {
      reset();
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin", "appraisers"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      notification.success("Đã tạo tài khoản appraiser");
    },
    onError: (error) =>
      notification.error("Không thể tạo appraiser", {
        description: isApiError(error) ? error.message : "Vui lòng kiểm tra lại thông tin.",
      }),
  });

  const demoteMutation = useMutation({
    mutationFn: adminAppraiserApi.demote,
    onSuccess: () => {
      setPendingAction(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "appraisers"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      notification.success("Đã khóa tài khoản appraiser");
    },
    onError: (error) =>
      notification.error("Không thể khóa tài khoản appraiser", {
        description: isApiError(error)
          ? error.message
          : "Appraiser có thể đang giữ phiên kiểm định chưa hết hạn.",
      }),
  });

  const restoreMutation = useMutation({
    mutationFn: adminUserApi.unban,
    onSuccess: () => {
      setPendingAction(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "appraisers"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      notification.success("Đã mở khóa tài khoản appraiser");
    },
    onError: (error) =>
      notification.error("Không thể mở khóa tài khoản appraiser", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });

  const appraisers = useMemo(() => usersQuery.data?.result ?? [], [usersQuery.data?.result]);
  const meta = usersQuery.data?.meta;
  const activeAppraiserCount = activeCountQuery.data?.meta.total ?? 0;
  const actionPending = demoteMutation.isPending || restoreMutation.isPending;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Quản lý appraiser</h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/95"
              onClick={() => {
                reset();
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tạo appraiser
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 hover:bg-white/5"
              onClick={() => void usersQuery.refetch()}
            >
              <RefreshCw className={cn("h-4 w-4", usersQuery.isFetching && "animate-spin")} />
              Làm mới
            </Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-card p-5 text-foreground flex items-center gap-4 shadow-md">
            <div className="flex size-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <UserRoundCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#a49a88]">
                Appraiser hiện tại
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#f2eee5]">
                {meta?.total ?? 0}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-card p-5 text-foreground flex items-center gap-4 shadow-md">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#a49a88]">
                Đang hoạt động
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#f2eee5]">
                {activeAppraiserCount}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-card text-foreground flex flex-col overflow-hidden shadow-xl shadow-black/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <h2 className="font-bold text-[#f2eee5]">Danh sách appraiser</h2>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a49a88]" />
              <Input
                className="border-white/10 bg-white/5 pl-9 text-foreground placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-primary/20"
                value={queryText}
                onChange={(event) => {
                  setQueryText(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm email hoặc tên"
              />
            </div>
          </div>

          {appraisers.length === 0 ? (
            <AdminEmptyState
              icon={ShieldCheck}
              title="Chưa có appraiser phù hợp"
              description="Tạo appraiser mới hoặc thử đổi từ khóa tìm kiếm để kiểm tra danh sách hiện tại."
              action={
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 hover:bg-white/5"
                  onClick={() => void usersQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Làm mới
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase text-[#a49a88]">
                  <tr>
                    <th className="px-5 py-3">Appraiser</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Ngày tạo</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {appraisers.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-white/5">
                      <td className="px-5 py-3">
                        <p className="font-bold text-[#f2eee5]">{user.fullName}</p>
                        <p className="text-xs text-[#a49a88]">{user.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold border",
                            user.status === "ACTIVE" &&
                              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            user.status === "BANNED" &&
                              "bg-red-500/10 text-red-400 border-red-500/20",
                            user.status === "UNVERIFIED" &&
                              "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          )}
                        >
                          {statusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#a49a88]">{formatDateTime(user.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          className={cn(
                            "border font-bold shadow-none",
                            user.status === "ACTIVE"
                              ? "border-red-500/20 bg-red-500/5 text-red-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                              : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300",
                          )}
                          disabled={actionPending || !["ACTIVE", "BANNED"].includes(user.status)}
                          onClick={() =>
                            setPendingAction({
                              user,
                              type: user.status === "ACTIVE" ? "ban" : "unban",
                            })
                          }
                        >
                          {user.status === "ACTIVE" ? (
                            <ShieldX className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                          {user.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {appraisers.length > 0 ? (
            <div className="border-t border-white/10 px-5 py-4">
              <Pagination page={meta?.page ?? page} pages={meta?.pages ?? 1} onPage={setPage} />
            </div>
          ) : null}
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-white/10 bg-[#171511] text-[#f2eee5] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#f2eee5]">
              Tạo appraiser mới
            </DialogTitle>
            <DialogDescription className="text-[#a49a88]">
              Điền các thông tin dưới đây để tạo tài khoản giám định viên mới.
            </DialogDescription>
          </DialogHeader>
          <form
            autoComplete="off"
            onSubmit={handleSubmit((data) => {
              void createMutation.mutateAsync(data);
            })}
            className="space-y-4 mt-2"
          >
            <div>
              <label className="text-xs font-bold text-[#a49a88] uppercase tracking-wider mb-1.5 block">
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
                placeholder="email@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400 font-semibold">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#a49a88] uppercase tracking-wider mb-1.5 block">
                Họ tên <span className="text-red-400">*</span>
              </label>
              <Input
                autoComplete="off"
                className={cn(
                  "border-white/10 bg-[#25221b] text-foreground placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-primary/20",
                  errors.fullName &&
                    "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20",
                )}
                placeholder="Nguyễn Văn A"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-400 font-semibold">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#a49a88] uppercase tracking-wider mb-1.5 block">
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
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-400 font-semibold">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#a49a88] uppercase tracking-wider mb-1.5 block">
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
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400 font-semibold">{errors.password.message}</p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/95"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
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

      <AdminConfirmDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={pendingAction?.type === "ban" ? "Khóa tài khoản appraiser?" : "Mở khóa appraiser?"}
        description={
          pendingAction?.type === "ban"
            ? `Tài khoản "${pendingAction?.user.fullName ?? ""}" sẽ bị khóa đăng nhập và không còn truy cập được khu kiểm định. Nếu appraiser đang giữ claim kiểm định còn hạn, hệ thống sẽ chặn thao tác này.`
            : `Tài khoản "${pendingAction?.user.fullName ?? ""}" sẽ được kích hoạt lại và có thể đăng nhập vào khu kiểm định.`
        }
        confirmLabel={pendingAction?.type === "ban" ? "Khóa tài khoản" : "Mở khóa"}
        isPending={actionPending}
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.type === "ban") {
            void demoteMutation.mutateAsync(pendingAction.user.id);
          } else {
            void restoreMutation.mutateAsync(pendingAction.user.id);
          }
        }}
      />
    </main>
  );
}
