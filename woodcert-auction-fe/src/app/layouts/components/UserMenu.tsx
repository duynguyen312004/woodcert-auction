import {
  ChevronDown,
  Gavel,
  Loader2,
  LogOut,
  MapPin,
  ReceiptText,
  Shield,
  ShieldCheck,
  Store,
  UserCircle2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useProfile } from "@/features/account";
import { authApi } from "@/features/auth";
import { clearAuthSession } from "@/shared/auth/auth-store";
import { SELLER_PATHS } from "@/shared/constants";
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
      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1c1a16] ring-2 ring-primary/0 transition-all duration-300 group-hover:ring-primary/40 group-hover:border-transparent"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fullName ?? "Ảnh đại diện"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-sans text-[10px] font-bold text-foreground">{initials}</span>
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

  const displayName = profile?.fullName ? profile.fullName.split(" ").slice(-2).join(" ") : "...";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] pl-1 pr-3.5 outline-none hover:bg-primary/5 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-300 text-left cursor-pointer"
          >
            <AvatarButton avatarUrl={profile?.avatarUrl} fullName={profile?.fullName} />
            <span className="hidden text-xs font-bold tracking-wide text-foreground/80 group-hover:text-primary transition-colors sm:block">
              {displayName}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors sm:block" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-60 border border-white/10 bg-[#161412]/95 backdrop-blur-lg rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-2">
          {/* User info header styled like a premium membership card */}
          {profile && (
            <div className="mb-2 rounded-lg bg-white/[0.02] border border-white/5 p-3 text-left">
              <p className="font-serif text-sm font-bold text-white tracking-wide truncate">
                {profile.fullName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-sans leading-none">
                {profile.email}
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#d6a84f] bg-[#d6a84f]/10 border border-[#d6a84f]/20 px-2 py-0.5 rounded">
                  Thành viên
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-mono">
                  ID: #{profile.id ? String(profile.id).slice(-6).toUpperCase() : "......"}
                </span>
              </div>
            </div>
          )}

          <DropdownMenuGroup className="space-y-0.5">
            {profile?.roles?.includes("ADMIN") && (
              <DropdownMenuItem
                asChild
                className="focus:bg-primary/10 focus:text-primary transition-all duration-150 rounded-lg group"
              >
                <Link
                  to="/admin"
                  className="flex w-full items-center gap-2.5 py-1 text-primary font-bold"
                  onClick={onMobileClose}
                >
                  <ShieldCheck className="h-4 w-4 text-primary group-hover:text-primary transition-colors" />
                  <span>Khu quản trị (Admin)</span>
                </Link>
              </DropdownMenuItem>
            )}
            {profile?.roles?.includes("APPRAISER") && (
              <DropdownMenuItem
                asChild
                className="focus:bg-primary/10 focus:text-primary transition-all duration-150 rounded-lg group"
              >
                <Link
                  to="/appraiser/products"
                  className="flex w-full items-center gap-2.5 py-1 text-primary font-bold"
                  onClick={onMobileClose}
                >
                  <Shield className="h-4 w-4 text-primary group-hover:text-primary transition-colors" />
                  <span>Khu kiểm định</span>
                </Link>
              </DropdownMenuItem>
            )}
            {profile?.hasSellerProfile ? (
              <DropdownMenuItem
                asChild
                className="focus:bg-primary/10 focus:text-primary transition-all duration-150 rounded-lg group"
              >
                <a
                  href={SELLER_PATHS.dashboard}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-2.5 py-1 text-primary font-bold"
                  onClick={onMobileClose}
                >
                  <Store className="h-4 w-4 text-primary group-hover:text-primary transition-colors" />
                  <span>Quản lý cửa hàng</span>
                </a>
              </DropdownMenuItem>
            ) : (
              !profile?.roles?.includes("ADMIN") &&
              !profile?.roles?.includes("APPRAISER") && (
                <DropdownMenuItem
                  asChild
                  className="focus:bg-primary/10 focus:text-primary transition-all duration-150 rounded-lg group"
                >
                  <Link
                    to={SELLER_PATHS.register}
                    className="flex w-full items-center gap-2.5 py-1 text-primary font-bold"
                    onClick={onMobileClose}
                  >
                    <Store className="h-4 w-4 text-primary group-hover:text-primary transition-colors" />
                    <span>Quản lý cửa hàng</span>
                  </Link>
                </DropdownMenuItem>
              )
            )}

            <DropdownMenuSeparator className="my-1.5 border-t border-white/5" />

            <DropdownMenuItem
              asChild
              className="focus:bg-primary/10 focus:text-primary transition-all duration-150 rounded-lg group"
            >
              <Link
                to="/account"
                className="flex w-full items-center gap-2.5 py-1"
                onClick={onMobileClose}
              >
                <UserCircle2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Hồ sơ cá nhân</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="focus:bg-primary/10 focus:text-primary transition-all duration-150 rounded-lg group"
            >
              <Link
                to="/my-auctions"
                className="flex w-full items-center gap-2.5 py-1"
                onClick={onMobileClose}
              >
                <Gavel className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Đấu giá của tôi</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="focus:bg-primary/10 focus:text-primary transition-all duration-150 rounded-lg group"
            >
              <Link
                to="/orders"
                className="flex w-full items-center gap-2.5 py-1"
                onClick={onMobileClose}
              >
                <ReceiptText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Đơn mua</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="focus:bg-primary/10 focus:text-primary transition-all duration-150 rounded-lg group"
            >
              <Link
                to="/account/addresses"
                className="flex w-full items-center gap-2.5 py-1"
                onClick={onMobileClose}
              >
                <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Sổ địa chỉ</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1.5 border-t border-white/5" />

          <DropdownMenuGroup>
            <DropdownMenuItem
              className="text-red-400 focus:bg-red-500/10 focus:text-red-400 transition-colors py-2.5 px-3 rounded-lg cursor-pointer flex items-center gap-2.5"
              onSelect={() => setLogoutOpen(true)}
            >
              <LogOut className="h-4 w-4 text-red-400/80" />
              <span>Đăng xuất</span>
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
