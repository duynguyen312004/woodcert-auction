import { Outlet } from "react-router";

import authBackground from "@/assets/images/mock/auth-woodcraft-gallery.webp";

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Background Section */}
      <div className="hidden lg:block relative overflow-hidden bg-zinc-950">
        <img
          src={authBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/45 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-center px-12 lg:px-24">
          <h1 className="text-4xl lg:text-5xl text-primary font-bold mb-4 font-serif drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            Woodcert Auction
          </h1>
          <p className="text-lg text-white/75 max-w-md drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Bước vào thế giới tinh hoa của nghệ thuật chế tác gỗ. Các phiên đấu giá tuyển chọn,
            nguồn gốc được chứng nhận, và quyền truy cập độc quyền.{" "}
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center p-8 lg:p-12 relative">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl text-primary font-bold font-serif mb-2">Woodcert Auction</h1>
            <p className="text-sm text-muted-foreground">The inner circle of timber craft</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
