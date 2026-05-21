/**
 * Sidebar thông tin tài khoản ở trang profile.
 *
 * Hiển thị thông tin người dùng, vai trò, thao tác upload/gỡ avatar và các nút
 * bảo mật tài khoản.
 */
import { Camera, ChevronRight, Key, Loader2, LogOut, Trash2 } from "lucide-react";
import { useRef, type ChangeEventHandler } from "react";
import { Link, useNavigate } from "react-router";

import { authApi } from "@/features/auth/api/auth";
import { clearAuthSession } from "@/shared/auth/auth-store";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useAvatarUpload } from "../hooks/useAvatarUpload";
import type { UserProfile } from "../types";

interface ProfileSidebarProps {
  profile: UserProfile;
}

const ROLE_LABEL: Record<string, string> = {
  BUYER: "Người mua",
  SELLER: "Người bán",
  APPRAISER: "Thẩm định viên",
  ADMIN: "Quản trị viên",
};

// Nếu tài khoản có nhiều role thì ưu tiên role có quyền cao hơn.
const ROLE_PRIORITY = ["ROLE_ADMIN", "ROLE_APPRAISER", "ROLE_SELLER", "ROLE_BIDDER"];

function AvatarFallback({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
      {initials}
    </div>
  );
}

export function ProfileSidebar({ profile }: ProfileSidebarProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, removeAvatar, isPending, isUploading, isRemoving } = useAvatarUpload();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuthSession();
      navigate("/");
    }
  };

  const handleAvatarClick = () => {
    if (isPending) return;
    fileInputRef.current?.click();
  };

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      await uploadAvatar(file);
    } catch {
      // onError của mutation đã hiển thị thông báo lỗi.
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatar();
    } catch {
      // onError của mutation đã hiển thị thông báo lỗi.
    }
  };

  const primaryRole =
    ROLE_PRIORITY.find((role) => profile.roles.includes(role)) ?? profile.roles[0] ?? "";
  // UI cũ gọi là BUYER, còn backend dùng ROLE_BIDDER.
  const legacyRole = primaryRole.replace(/^ROLE_/, "").replace("BIDDER", "BUYER");

  return (
    <aside className="space-y-6" aria-label="Thông tin tài khoản">
      <div className="flex flex-col items-center rounded-xl border border-border/60 bg-card p-8 shadow-sm">
        <div
          className={cn("group relative mb-5", isPending ? "cursor-wait" : "cursor-pointer")}
          onClick={handleAvatarClick}
          aria-busy={isPending}
        >
          <div
            className={cn(
              "relative h-36 w-36 overflow-hidden rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-card transition-all group-hover:ring-primary/70",
              isPending && "ring-primary/70",
            )}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`Ảnh đại diện của ${profile.fullName}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <AvatarFallback name={profile.fullName} />
            )}

            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                isPending && "opacity-100",
              )}
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" aria-hidden />
              ) : (
                <Camera className="h-6 w-6 text-white" aria-hidden />
              )}
              <span className="text-[10px] font-bold uppercase text-white">
                {isUploading ? "Đang tải" : "Thay đổi"}
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Thay đổi ảnh đại diện"
            className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
            onClick={(event) => {
              event.stopPropagation();
              handleAvatarClick();
            }}
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Camera className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Chọn ảnh đại diện"
          disabled={isPending}
          onChange={handleFileChange}
        />

        {profile.avatarUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mb-4 border-destructive/25 text-destructive hover:bg-destructive/8 hover:text-destructive"
            disabled={isPending}
            onClick={handleRemoveAvatar}
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
            Gỡ ảnh
          </Button>
        )}

        <h2 className="font-serif text-xl font-bold text-foreground">{profile.fullName}</h2>
        <p className="mt-1 text-[11px] font-bold uppercase text-primary">
          {ROLE_LABEL[legacyRole] ?? primaryRole}
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-xs font-bold uppercase text-muted-foreground">
          Bảo mật tài khoản
        </h3>

        <div className="space-y-2">
          <Link
            to="/auth/forgot-password"
            className="group flex w-full items-center justify-between rounded-lg border border-border/40 bg-background/40 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <span className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              Đổi mật khẩu
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>

          <Button
            type="button"
            variant="ghost"
            className="group w-full justify-between px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/8 hover:text-destructive"
            onClick={handleLogout}
          >
            <span className="flex items-center gap-3">
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
