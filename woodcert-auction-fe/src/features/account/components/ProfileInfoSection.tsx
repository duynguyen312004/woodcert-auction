import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { updateProfileSchema, type UpdateProfilePayload, type UserProfile } from "../types";

interface ProfileInfoSectionProps {
  profile: UserProfile;
}

function FieldDisplay({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="font-sans text-sm font-semibold text-foreground">
        {value || <span className="italic text-muted-foreground">Chưa cập nhật</span>}
      </p>
    </div>
  );
}

export function ProfileInfoSection({ profile }: ProfileInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfilePayload>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber ?? "",
    },
  });

  // Sync form khi profile thay đổi (ví dụ invalidate → refetch)
  useEffect(() => {
    reset({
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber ?? "",
    });
  }, [profile, reset]);

  const onSubmit = async (data: UpdateProfilePayload) => {
    try {
      await updateProfile.mutateAsync(data);
      setIsEditing(false);
    } catch (error: unknown) {
      if (isApiError(error) && error.fieldErrors) {
        const fields = ["fullName", "phoneNumber"] as const;
        for (const field of fields) {
          const msg = error.fieldErrors[field];
          if (msg) setError(field, { type: "server", message: msg });
        }
      }
    }
  };

  const handleCancel = () => {
    reset({
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber ?? "",
    });
    setIsEditing(false);
  };

  // ── Ngày gia nhập (hiển thị Tháng, Năm) ──────────────────────
  const createdAt = new Date(profile.createdAt);
  const joinedDate = Number.isNaN(createdAt.getTime())
    ? null
    : createdAt.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  return (
    <section
      className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
      aria-labelledby="profile-info-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 bg-card/60 px-6 py-4">
        <h2
          id="profile-info-heading"
          className="font-serif text-lg font-bold tracking-tight text-foreground"
        >
          Thông tin cơ bản
        </h2>

        {!isEditing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-1.5 text-primary hover:text-primary/80"
            aria-label="Chỉnh sửa thông tin"
          >
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleCancel}
            aria-label="Hủy chỉnh sửa"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Body */}
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>
          {/* Họ và tên */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              {...register("fullName")}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber">Số điện thoại</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="0912345678"
              {...register("phoneNumber")}
              aria-invalid={!!errors.phoneNumber}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>

          {/* Email — chỉ đọc */}
          <div className="space-y-1.5">
            <Label htmlFor="email-readonly">Email</Label>
            <Input
              id="email-readonly"
              type="email"
              value={profile.email}
              readOnly
              disabled
              className="cursor-not-allowed opacity-60"
              aria-label="Email (chỉ đọc)"
            />
            <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 text-primary-foreground"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Lưu thay đổi
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Hủy
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <FieldDisplay label="Họ và tên" value={profile.fullName} />
          <FieldDisplay label="Email" value={profile.email} />
          <FieldDisplay label="Số điện thoại" value={profile.phoneNumber} />
          <FieldDisplay label="Ngày gia nhập" value={joinedDate} />
        </div>
      )}
    </section>
  );
}
