import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { formatDateTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useNotification } from "@/shared/ui/notification";
import { Pagination } from "@/shared/ui/pagination";

import {
  adminUserApi,
  type AdminUser,
  type CapabilityState,
  type UserCapability,
} from "../api/users";
import { AdminCreateAppraiserDialog } from "../components/AdminCreateAppraiserDialog";
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

const CAPABILITY_CONFIG: Array<{
  capability: UserCapability;
  role: string;
  label: string;
}> = [
  { capability: "BUYER", role: "ROLE_BIDDER", label: "Mua" },
  { capability: "SELLER", role: "ROLE_SELLER", label: "Bán" },
  { capability: "APPRAISER", role: "ROLE_APPRAISER", label: "Kiểm định" },
];

type PendingAction =
  | { user: AdminUser; type: "account-ban" }
  | { user: AdminUser; type: "account-unban" }
  | { user: AdminUser; type: "capability-ban"; capability: UserCapability }
  | { user: AdminUser; type: "capability-unban"; capability: UserCapability };

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

function capabilityStatus(user: AdminUser, capability: UserCapability): CapabilityState {
  return (
    user.capabilityStatuses?.find((item) => item.capability === capability)?.status ?? "ACTIVE"
  );
}

function actionTitle(action: PendingAction | null) {
  if (!action) return "";
  if (action.type === "account-ban") return "Khóa tài khoản này?";
  if (action.type === "account-unban") return "Mở khóa tài khoản này?";
  if (action.type === "capability-ban") return "Khóa quyền này?";
  return "Mở quyền này?";
}

function actionConfirmLabel(action: PendingAction | null) {
  if (!action) return "Xác nhận";
  if (action.type === "account-ban") return "Khóa tài khoản";
  if (action.type === "account-unban") return "Mở khóa tài khoản";
  if (action.type === "capability-ban") return "Khóa quyền";
  return "Mở quyền";
}

function actionDescription(action: PendingAction | null) {
  if (!action) return "";
  if (action.type === "account-ban") {
    return `Tài khoản "${action.user.fullName}" sẽ không thể đăng nhập cho đến khi được mở khóa.`;
  }
  if (action.type === "account-unban") {
    return `Tài khoản "${action.user.fullName}" sẽ đăng nhập lại được, nhưng các capability đang bị khóa vẫn giữ nguyên.`;
  }
  const label =
    CAPABILITY_CONFIG.find((item) => item.capability === action.capability)?.label ??
    action.capability;
  return `Tài khoản "${action.user.fullName}" sẽ ${action.type === "capability-ban" ? "mất" : "được khôi phục"} quyền ${label.toLowerCase()}.`;
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const [queryText, setQueryText] = useState("");
  const [role, setRole] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [createAppraiserOpen, setCreateAppraiserOpen] = useState(false);

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

  const invalidateUsers = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const closeAction = () => {
    setPendingAction(null);
    setReason("");
    setReasonError("");
  };

  const accountBanMutation = useMutation({
    mutationFn: adminUserApi.ban,
    onSuccess: () => {
      closeAction();
      invalidateUsers();
      notification.success("Đã khóa tài khoản");
    },
    onError: (error) =>
      notification.error("Không thể khóa tài khoản", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });

  const accountUnbanMutation = useMutation({
    mutationFn: adminUserApi.unban,
    onSuccess: () => {
      closeAction();
      invalidateUsers();
      notification.success("Đã mở khóa tài khoản");
    },
    onError: (error) =>
      notification.error("Không thể mở khóa tài khoản", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });

  const capabilityBanMutation = useMutation({
    mutationFn: adminUserApi.banCapability,
    onSuccess: () => {
      closeAction();
      invalidateUsers();
      notification.success("Đã khóa quyền");
    },
    onError: (error) =>
      notification.error("Không thể khóa quyền", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });

  const capabilityUnbanMutation = useMutation({
    mutationFn: adminUserApi.unbanCapability,
    onSuccess: () => {
      closeAction();
      invalidateUsers();
      notification.success("Đã mở quyền");
    },
    onError: (error) =>
      notification.error("Không thể mở quyền", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });

  const users = useMemo(() => usersQuery.data?.result ?? [], [usersQuery.data?.result]);
  const meta = usersQuery.data?.meta;
  const actionPending =
    accountBanMutation.isPending ||
    accountUnbanMutation.isPending ||
    capabilityBanMutation.isPending ||
    capabilityUnbanMutation.isPending;

  const resetPage = () => setPage(1);

  const openAction = (action: PendingAction) => {
    setPendingAction(action);
    setReason("");
    setReasonError("");
  };

  const confirmAction = () => {
    const normalizedReason = reason.trim();
    if (!pendingAction) return;
    if (!normalizedReason) {
      setReasonError("Vui lòng nhập lý do.");
      return;
    }
    if (pendingAction.type === "account-ban") {
      void accountBanMutation.mutateAsync({
        userId: pendingAction.user.id,
        reason: normalizedReason,
      });
      return;
    }
    if (pendingAction.type === "account-unban") {
      void accountUnbanMutation.mutateAsync({
        userId: pendingAction.user.id,
        reason: normalizedReason,
      });
      return;
    }
    if (pendingAction.type === "capability-ban") {
      void capabilityBanMutation.mutateAsync({
        userId: pendingAction.user.id,
        capability: pendingAction.capability,
        reason: normalizedReason,
      });
      return;
    }
    void capabilityUnbanMutation.mutateAsync({
      userId: pendingAction.user.id,
      capability: pendingAction.capability,
      reason: normalizedReason,
    });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Người dùng</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/95"
              onClick={() => setCreateAppraiserOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Tạo appraiser
            </Button>
            <Button type="button" variant="outline" onClick={() => void usersQuery.refetch()}>
              <RefreshCw className={cn("h-4 w-4", usersQuery.isFetching && "animate-spin")} />
              Làm mới
            </Button>
          </div>
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
            <p className="mt-4 text-xs font-semibold uppercase text-[#a49a88]">Đã khóa account</p>
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
                <table className="w-full min-w-[1080px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase text-[#a49a88]">
                    <tr>
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Vai trò</th>
                      <th className="px-5 py-3">Account</th>
                      <th className="px-5 py-3">Capability</th>
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
                              "rounded-full border px-2.5 py-1 text-xs font-bold",
                              user.status === "ACTIVE" &&
                                "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                              user.status === "BANNED" &&
                                "border-red-500/20 bg-red-500/10 text-red-400",
                              user.status === "UNVERIFIED" &&
                                "border-amber-500/20 bg-amber-500/10 text-amber-400",
                            )}
                          >
                            {statusLabel(user.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {CAPABILITY_CONFIG.filter((item) => user.roles.includes(item.role)).map(
                              (item) => {
                                const current = capabilityStatus(user, item.capability);
                                return (
                                  <span
                                    key={item.capability}
                                    className={cn(
                                      "rounded-full border px-2 py-1 text-[11px] font-bold",
                                      current === "ACTIVE"
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                        : "border-red-500/20 bg-red-500/10 text-red-400",
                                    )}
                                  >
                                    {item.label}: {current === "ACTIVE" ? "Active" : "Banned"}
                                  </span>
                                );
                              },
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[#a49a88]">
                          {formatDateTime(user.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          {isAdmin(user) ? (
                            <div className="text-right text-xs text-[#8d877c]">Không áp dụng</div>
                          ) : (
                            <div className="flex flex-wrap justify-end gap-2">
                              {user.status === "BANNED" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="border border-emerald-500/20 bg-emerald-500/5 font-bold text-emerald-400 shadow-none hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                                  disabled={actionPending}
                                  onClick={() => openAction({ user, type: "account-unban" })}
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                  Mở account
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="border border-red-500/20 bg-red-500/5 font-bold text-red-400 shadow-none hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                                  disabled={actionPending || user.status !== "ACTIVE"}
                                  onClick={() => openAction({ user, type: "account-ban" })}
                                >
                                  <Ban className="h-4 w-4" />
                                  Khóa account
                                </Button>
                              )}
                              {CAPABILITY_CONFIG.filter((item) =>
                                user.roles.includes(item.role),
                              ).map((item) => {
                                const current = capabilityStatus(user, item.capability);
                                const banned = current === "BANNED";
                                return (
                                  <Button
                                    key={item.capability}
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className={cn(
                                      "border-white/10 bg-white/5 text-[#d2c5b2] hover:bg-white/10",
                                      banned &&
                                        "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10",
                                    )}
                                    disabled={actionPending}
                                    onClick={() =>
                                      openAction({
                                        user,
                                        type: banned ? "capability-unban" : "capability-ban",
                                        capability: item.capability,
                                      })
                                    }
                                  >
                                    {banned ? (
                                      <ShieldCheck className="h-4 w-4" />
                                    ) : (
                                      <ShieldX className="h-4 w-4" />
                                    )}
                                    {banned ? `Mở ${item.label}` : `Khóa ${item.label}`}
                                  </Button>
                                );
                              })}
                            </div>
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
          if (!open) closeAction();
        }}
        title={actionTitle(pendingAction)}
        description={actionDescription(pendingAction)}
        confirmLabel={actionConfirmLabel(pendingAction)}
        isPending={actionPending}
        reasonValue={reason}
        reasonError={reasonError}
        reasonPlaceholder="Nhập lý do để lưu audit log"
        onReasonChange={(value) => {
          setReason(value);
          if (reasonError) setReasonError("");
        }}
        onConfirm={confirmAction}
      />
      <AdminCreateAppraiserDialog
        open={createAppraiserOpen}
        onOpenChange={setCreateAppraiserOpen}
        onCreated={() => {
          setRole("ROLE_APPRAISER");
          setStatus(undefined);
          setPage(1);
          invalidateUsers();
        }}
      />
    </main>
  );
}
