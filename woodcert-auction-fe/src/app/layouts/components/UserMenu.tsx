import { Loader2, LogOut, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useProfile } from "@/features/account/hooks/useProfile";
import { authApi } from "@/features/auth/api/auth";
import { clearAuthSession } from "@/shared/auth/auth-store";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

// ── Avatar — hiển thị ảnh thật hoặc initials ─────────────────
function AvatarButton({
  avatarUrl,
  fullName,
}: {
  avatarUrl: string | null | undefined;
  fullName: string | undefined;
}) {
  const initials = (fullName ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div
      aria-label={`Tài khoản: ${fullName ?? "..."}`}
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 bg-card ring-1 ring-primary/0 transition-all hover:border-primary/50 hover:ring-1 hover:ring-primary/30"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fullName ?? "Ảnh đại diện"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-serif text-xs font-semibold text-foreground">{initials}</span>
      )}
    </div>
  );
}

// ── Logout confirmation dialog ────────────────────────────────
function LogoutDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận đăng xuất</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn đăng xuất khỏi WoodCert không? Phiên làm việc hiện tại sẽ kết
            thúc.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={isPending}>
              Hủy bỏ
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Đăng xuất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── UserMenu — avatar + dropdown + logout dialog ──────────────
export function UserMenu({ onMobileClose }: { onMobileClose?: () => void }) {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } finally {
      clearAuthSession();
      setLogoutOpen(false);
      setIsLoggingOut(false);
      onMobileClose?.();
      navigate("/");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
          >
            <AvatarButton avatarUrl={profile?.avatarUrl} fullName={profile?.fullName} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          {/* User info header */}
          {profile && (
            <>
              <DropdownMenuLabel className="normal-case tracking-normal text-sm font-semibold text-foreground px-3 py-2.5">
                <p className="truncate">{profile.fullName}</p>
                <p className="text-xs font-normal text-muted-foreground truncate mt-0.5">
                  {profile.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 border-t border-border/40" />
            </>
          )}

          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link
                to="/account"
                className="flex w-full items-center gap-2.5"
                onClick={onMobileClose}
              >
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                Hồ sơ cá nhân
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1 border-t border-border/40" />

          <DropdownMenuGroup>
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => setLogoutOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={handleLogoutConfirm}
        isPending={isLoggingOut}
      />
    </>
  );
}
