import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, RefreshCw, Search, ShieldCheck, UserRound, Users } from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { formatDateTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useNotification } from "@/shared/ui/notification";
import { Pagination } from "@/shared/ui/pagination";

import { adminUserApi, type AdminUser } from "../api/users";
import { AdminConfirmDialog } from "../components/AdminConfirmDialog";
import { AdminEmptyState } from "../components/AdminEmptyState";

const ROLE_FILTERS: Array<{ label: string; role?: string }> = [
  { label: "Tất cả" },
  { label: "Người mua", role: "ROLE_BIDDER" },
  { label: "Người bán", role: "ROLE_SELLER" },
  { label: "Appraiser", role: "ROLE_APPRAISER" },
  { label: "Admin", role: "ROLE_ADMIN" },
];

const STATUS_FILTERS: Array<{ label: string; status?: string }> = [
  { label: "Tất cả" },
  { label: "Đang hoạt động", status: "ACTIVE" },
  { label: "Đã khóa", status: "BANNED" },
  { label: "Chưa xác minh", status: "UNVERIFIED" },
];

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  BANNED: "Đã khóa",
  UNVERIFIED: "Chưa xác minh",
};

function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}

function isAdmin(user: AdminUser) {
  return user.roles.includes("ROLE_ADMIN");
}

function roleLabel(user: AdminUser) {
  if (user.roles.includes("ROLE_ADMIN")) return "Admin";
  if (user.roles.includes("ROLE_APPRAISER")) return "Appraiser";
  if (user.roles.includes("ROLE_SELLER")) return "Người bán";
  return "Người mua";
}

function roleBadgeClass(user: AdminUser) {
  if (user.roles.includes("ROLE_ADMIN")) return "bg-primary/10 text-primary border-primary/20";
  if (user.roles.includes("ROLE_APPRAISER"))
    return "bg-violet-500/10 text-violet-300 border-violet-500/20";
  if (user.roles.includes("ROLE_SELLER"))
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  return "bg-sky-500/10 text-sky-400 border-sky-500/20";
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const [queryText, setQueryText] = useState("");
  const [role, setRole] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<{
    user: AdminUser;
    type: "ban" | "unban";
  } | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", { role, status, queryText, page }],
    queryFn: () =>
      adminUserApi.getUsers({
        role,
        status,
        query: queryText || undefined,
        page,
        size: 20,
      }),
  });

  // Đếm tổng/đang hoạt động/đã khóa theo bộ lọc role hiện tại (size 1 chỉ lấy meta.total).
  const totalQuery = useQuery({
    queryKey: ["admin", "users", "count", { role, status: undefined }],
    queryFn: () => adminUserApi.getUsers({ role, size: 1 }),
  });
  const activeQuery = useQuery({
    queryKey: ["admin", "users", "count", { role, status: "ACTIVE" }],
    queryFn: () => adminUserApi.getUsers({ role, status: "ACTIVE", size: 1 }),
  });
  const bannedQuery = useQuery({
    queryKey: ["admin", "users", "count", { role, status: "BANNED" }],
    queryFn: () => adminUserApi.getUsers({ role, status: "BANNED", size: 1 }),
  });

  const banMutation = useMutation({
    mutationFn: adminUserApi.ban,
    onSuccess: () => {
      setPendingAction(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      notification.success("Đã khóa tài khoản");
    },
    onError: (error) =>
      notification.error("Không thể khóa tài khoản", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });

  const unbanMutation = useMutation({
    mutationFn: adminUserApi.unban,
    onSuccess: () => {
      setPendingAction(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      notification.success("Đã mở khóa tài khoản");
    },
    onError: (error) =>
      notification.error("Không thể mở khóa tài khoản", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });

  const users = useMemo(() => usersQuery.data?.result ?? [], [usersQuery.data?.result]);
  const meta = usersQuery.data?.meta;
  const actionPending = banMutation.isPending || unbanMutation.isPending;

  const resetPage = () => setPage(1);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Người dùng</h1>
          </div>
          <Button type="button" variant="outline" onClick={() => void usersQuery.refetch()}>
            <RefreshCw className={cn("h-4 w-4", usersQuery.isFetching && "animate-spin")} />
            Làm mới
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-card p-5 text-foreground">
            <Users className="h-6 w-6 text-primary" />
            <p className="mt-4 text-xs font-semibold uppercase text-[#a49a88]">Tổng người dùng</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#f2eee5]">
              {totalQuery.data?.meta.total ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-card p-5 text-foreground">
            <UserRound className="h-6 w-6 text-emerald-400" />
            <p className="mt-4 text-xs font-semibold uppercase text-[#a49a88]">Đang hoạt động</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#f2eee5]">
              {activeQuery.data?.meta.total ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-card p-5 text-foreground">
            <Ban className="h-6 w-6 text-red-400" />
            <p className="mt-4 text-xs font-semibold uppercase text-[#a49a88]">Đã khóa</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#f2eee5]">
              {bannedQuery.data?.meta.total ?? 0}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-card text-foreground">
          <div className="space-y-4 border-b border-white/10 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-[#f2eee5]">Danh sách người dùng</h2>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a49a88]" />
                <Input
                  className="border-white/10 bg-white/5 pl-9 text-foreground placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-primary/20"
                  value={queryText}
                  onChange={(e) => {
                    setQueryText(e.target.value);
                    resetPage();
                  }}
                  placeholder="Tìm email hoặc tên"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ROLE_FILTERS.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => {
                    setRole(filter.role);
                    resetPage();
                  }}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                    role === filter.role
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/12 bg-white/5 text-[#d2c5b2] hover:bg-white/10 hover:text-primary",
                  )}
                >
                  {filter.label}
                </button>
              ))}
              <span className="mx-1 self-center text-white/10">|</span>
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => {
                    setStatus(filter.status);
                    resetPage();
                  }}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                    status === filter.status
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/12 bg-white/5 text-[#d2c5b2] hover:bg-white/10 hover:text-primary",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {users.length === 0 ? (
            <AdminEmptyState
              icon={Users}
              title="Không tìm thấy người dùng"
              description="Thử đổi bộ lọc hoặc từ khóa tìm kiếm để kiểm tra danh sách user mới nhất."
              action={
                <Button type="button" variant="outline" onClick={() => void usersQuery.refetch()}>
                  <RefreshCw className="h-4 w-4" />
                  Làm mới
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase text-[#a49a88]">
                    <tr>
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Vai trò</th>
                      <th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3">Ngày tạo</th>
                      <th className="px-5 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((user) => (
                      <tr key={user.id} className="transition-colors hover:bg-white/5">
                        <td className="px-5 py-3">
                          <p className="font-bold text-[#f2eee5]">{user.fullName}</p>
                          <p className="text-xs text-[#a49a88]">{user.email}</p>
                          {user.phoneNumber ? (
                            <p className="mt-1 text-xs text-[#8d877c]">{user.phoneNumber}</p>
                          ) : null}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-bold",
                              roleBadgeClass(user),
                            )}
                          >
                            {roleLabel(user)}
                          </span>
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
                        <td className="px-5 py-3 text-[#a49a88]">
                          {formatDateTime(user.createdAt)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {isAdmin(user) ? (
                            <span className="text-xs text-[#8d877c]">—</span>
                          ) : user.status === "BANNED" ? (
                            <Button
                              type="button"
                              size="sm"
                              className="border border-emerald-500/20 bg-emerald-500/5 font-bold text-emerald-400 shadow-none hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                              disabled={actionPending}
                              onClick={() => setPendingAction({ user, type: "unban" })}
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Mở khóa
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              className="border border-red-500/20 bg-red-500/5 font-bold text-red-400 shadow-none hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                              disabled={actionPending || user.status !== "ACTIVE"}
                              onClick={() => setPendingAction({ user, type: "ban" })}
                            >
                              <Ban className="h-4 w-4" />
                              Khóa
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-white/10 px-5 py-4">
                <Pagination page={meta?.page ?? page} pages={meta?.pages ?? 1} onPage={setPage} />
              </div>
            </>
          )}
        </section>
      </div>

      <AdminConfirmDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={pendingAction?.type === "ban" ? "Khóa tài khoản này?" : "Mở khóa tài khoản này?"}
        description={
          pendingAction?.type === "ban"
            ? `Tài khoản "${pendingAction?.user.fullName ?? ""}" sẽ không thể đăng nhập cho đến khi được mở khóa.`
            : `Tài khoản "${pendingAction?.user.fullName ?? ""}" sẽ được kích hoạt lại và có thể đăng nhập.`
        }
        confirmLabel={pendingAction?.type === "ban" ? "Khóa tài khoản" : "Mở khóa"}
        isPending={actionPending}
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.type === "ban") {
            void banMutation.mutateAsync(pendingAction.user.id);
          } else {
            void unbanMutation.mutateAsync(pendingAction.user.id);
          }
        }}
      />
    </main>
  );
}
