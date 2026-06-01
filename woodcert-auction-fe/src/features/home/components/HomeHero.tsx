import { ChevronDown, Loader2, Play, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { useSellerProfile } from "@/features/account";
import { useAuthStore } from "@/shared/auth/auth-store";
import heroImg from "@/assets/images/hero_background.png";

export function HomeHero() {
  const navigate = useNavigate();
  const authStatus = useAuthStore((s) => s.status);
  const isAuthenticated = authStatus === "authenticated";

  const sellerProfile = useSellerProfile({
    enabled: isAuthenticated,
  });

  const isCheckingSeller = isAuthenticated && sellerProfile.isPending;

  const handleScrollDown = () => {
    const nextSection = document.getElementById("featured-auctions");
    nextSection?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSellClick = () => {
    if (authStatus === "loading") return;

    if (!isAuthenticated) {
      // Chưa đăng nhập → chuyển thẳng sang trang đăng nhập ở tab hiện tại
      navigate("/auth/login", { state: { from: { pathname: "/seller/dashboard" } } });
      return;
    }

    if (sellerProfile.isPending) {
      return;
    }

    // Đã đăng nhập → mở tab mới để giữ nguyên tab hiện tại
    if (sellerProfile.data) {
      window.open("/seller/dashboard", "_blank", "noopener,noreferrer");
    } else {
      window.open("/seller/register", "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section className="auction-hero relative -mt-[4.25rem] flex w-full flex-col items-center justify-center overflow-hidden bg-[#0f0f0d]">
      {/* Ảnh nền — object-cover, căn giữa */}
      <img
        src={heroImg}
        alt="WoodCert Auction"
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center sm:object-cover"
        style={{ imageRendering: "auto" }}
      />

      {/* Overlay 1: tấm đen nhẹ đều toàn màn — đúng như theme (bg-black/40) */}
      <div className="absolute inset-0 z-[1] bg-black/40" />

      <div className="hero-gradient-overlay absolute inset-0 z-[1]" />

      {/* Content */}
      <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <div
          className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-sm"
          style={{ animationDelay: "0.1s" }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Fine Wood Art Auction
        </div>

        <h1
          className="animate-fade-in-up mb-6 font-serif text-5xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-xl md:text-7xl"
          style={{ animationDelay: "0.25s" }}
        >
          WoodCert Auction
        </h1>

        <p
          className="animate-fade-in-up mb-10 max-w-2xl text-base font-light leading-relaxed text-white/90 md:text-lg"
          style={{ animationDelay: "0.4s" }}
        >
          Sàn đấu giá gỗ mỹ nghệ kiểm định — Kết nối tinh hoa nghệ thuật gỗ Việt qua những tác phẩm
          độc bản từ các nghệ nhân bậc thầy.
        </p>

        <div
          className="animate-fade-in-up flex flex-col items-center gap-4 sm:flex-row"
          style={{ animationDelay: "0.55s" }}
        >
          <Link
            to="/auctions"
            className="group inline-flex min-w-[240px] items-center justify-center gap-2.5 rounded bg-primary py-4 px-10 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-300 hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/40"
          >
            <Play className="h-5 w-5 fill-current transition-transform group-hover:translate-x-0.5" />
            Khám phá đấu giá
          </Link>

          <button
            type="button"
            onClick={handleSellClick}
            disabled={isCheckingSeller}
            className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded border-2 border-white/30 bg-transparent py-4 px-10 text-lg font-bold text-white transition-all duration-300 hover:border-white hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCheckingSeller && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            Đăng bán tác phẩm
          </button>
        </div>
      </div>

      <button
        type="button"
        aria-label="Cuộn xuống"
        onClick={handleScrollDown}
        className="animate-bounce-y absolute bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/20 bg-white/8 p-2.5 text-white/60 backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-primary"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </section>
  );
}
