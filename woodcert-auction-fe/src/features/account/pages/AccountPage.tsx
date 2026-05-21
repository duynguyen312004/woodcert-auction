import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { ProfileInfoSection } from "../components/ProfileInfoSection";
import { ProfileSidebar } from "../components/ProfileSidebar";
import { SellerStatusCard } from "../components/SellerStatusCard";
import { useProfile, useSellerProfile } from "../hooks/useProfile";

// Khung loading cho trang profile.
function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3" aria-busy="true" aria-label="Đang tải">
      {/* Khung loading của sidebar */}
      <div className="space-y-6 lg:col-span-1">
        <div className="flex flex-col items-center rounded-xl border border-border/40 bg-card p-8">
          <div className="mb-5 h-36 w-36 animate-pulse rounded-full bg-muted" />
          <div className="mb-2 h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-32 animate-pulse rounded-xl border border-border/40 bg-card" />
      </div>

      {/* Khung loading của nội dung chính */}
      <div className="space-y-6 lg:col-span-2">
        <div className="h-52 animate-pulse rounded-xl border border-border/40 bg-card" />
        <div className="h-28 animate-pulse rounded-xl border border-border/40 bg-card" />
      </div>
    </div>
  );
}

// Trạng thái lỗi khi không tải được profile.
function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden />
      <div>
        <p className="font-semibold text-foreground">Không thể tải hồ sơ</p>
        <p className="text-sm text-muted-foreground">Đã xảy ra lỗi khi lấy thông tin tài khoản.</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  );
}

// Component chính của trang.
export function AccountPage() {
  const profile = useProfile();
  const sellerProfile = useSellerProfile();

  if (profile.isPending) {
    return (
      <div className="container mx-auto max-w-[1040px] px-4 py-10">
        <div className="mb-8 border-b border-border/40 pb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
        </div>
        <ProfileSkeleton />
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="container mx-auto max-w-[1040px] px-4 py-10">
        <ProfileError onRetry={() => profile.refetch()} />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1040px] animate-fade-in px-4 py-10">
      {/* Tiêu đề trang */}
      <header className="mb-8 border-b border-border/40 pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Hồ sơ cá nhân
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Quản lý thông tin tài khoản và thiết lập quyền riêng tư của bạn.
        </p>
      </header>

      {/* Bố cục 3 cột: 1 cột sidebar và 2 cột nội dung */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cột trái: sidebar */}
        <div className="lg:col-span-1">
          <ProfileSidebar profile={profile.data} />
        </div>

        {/* Cột phải: thông tin tài khoản và seller */}
        <div className="space-y-6 lg:col-span-2">
          <ProfileInfoSection profile={profile.data} />

          <SellerStatusCard
            sellerProfile={sellerProfile.data}
            isLoading={sellerProfile.isPending}
          />
        </div>
      </div>

      {/* Overlay nhỏ khi đang cập nhật dữ liệu */}
      {profile.isFetching && !profile.isPending && (
        <div
          role="status"
          aria-label="Đang cập nhật"
          className="fixed bottom-5 right-5 flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 shadow-lg"
        >
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Đang đồng bộ...</span>
        </div>
      )}
    </div>
  );
}
