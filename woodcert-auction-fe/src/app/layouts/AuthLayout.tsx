import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Background Section */}
      <div className="hidden lg:block relative overflow-hidden bg-zinc-950">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=2670&auto=format&fit=crop')", // Substitute with your own wood image later
            filter: "contrast(1.2) grayscale(0.8)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-12 lg:px-24">
          <h1 className="text-4xl lg:text-5xl text-primary font-bold mb-4 font-serif">
            Woodcert Auction
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
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
