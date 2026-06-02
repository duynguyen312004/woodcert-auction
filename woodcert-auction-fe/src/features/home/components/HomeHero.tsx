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
    <section className="auction-hero relative -mt-[4.25rem] flex w-full flex-col items-center justify-center overflow-hidden bg-[#0f0f0d] select-none">
      {/* Decorative Golden Ambient Glows */}
      <div className="absolute top-1/4 left-1/10 z-10 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 z-10 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Decorative vertical lines for Art Deco luxury feel */}
      <div className="absolute left-8 top-0 bottom-0 z-10 hidden w-px bg-gradient-to-b from-transparent via-white/5 to-transparent md:block" />
      <div className="absolute right-8 top-0 bottom-0 z-10 hidden w-px bg-gradient-to-b from-transparent via-white/5 to-transparent md:block" />

      {/* Ảnh nền — object-cover, căn giữa */}
      <img
        src={heroImg}
        alt="WoodCert Auction"
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center scale-100"
        style={{ imageRendering: "auto" }}
      />

      {/* Overlay 1: tấm đen nhẹ đều toàn màn — đúng như theme (bg-black/40) */}
      <div className="absolute inset-0 z-[1] bg-black/50" />

      <div className="hero-gradient-overlay absolute inset-0 z-[1]" />

      {/* Content */}
      <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center px-6 text-center pt-16">
        <div
          className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-md shadow-[0_0_15px_rgba(214,168,79,0.1)]"
          style={{ animationDelay: "0.1s" }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Fine Wood Art Auction
        </div>

        <h1
          className="animate-fade-in-up mb-6 font-serif tracking-tight text-white drop-shadow-2xl"
          style={{ animationDelay: "0.25s" }}
        >
          <span className="block text-sm md:text-lg font-light tracking-[0.3em] uppercase text-primary mb-3">
            Sàn đấu giá nghệ thuật gỗ kiểm định
          </span>
          <span className="block text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-b from-white via-white to-primary/80 bg-clip-text text-transparent leading-[1.1] pb-1">
            WoodCert Auction
          </span>
        </h1>

        <p
          className="animate-fade-in-up mb-10 max-w-2xl text-sm font-light leading-relaxed text-white/80 md:text-base tracking-wide"
          style={{ animationDelay: "0.4s" }}
        >
          Kết nối tinh hoa mỹ nghệ gỗ Việt qua những tác phẩm độc bản. Mỗi bảo vật đều sở hữu chứng
          thư WoodCert vật lý & kỹ thuật số độc quyền, cam kết chất lượng tuyệt đối từ các nghệ nhân
          bậc thầy.
        </p>

        <div
          className="animate-fade-in-up flex flex-col items-center gap-5 sm:flex-row"
          style={{ animationDelay: "0.55s" }}
        >
          <Link
            to="/auctions"
            className="group relative overflow-hidden inline-flex min-w-[240px] items-center justify-center gap-2.5 rounded bg-primary py-4 px-10 text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all duration-300 hover:bg-primary/95 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            {/* GPU-accelerated sweep effect on hover */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out will-change-transform" />
            <Play className="h-4.5 w-4.5 fill-current transition-transform group-hover:translate-x-0.5" />
            Khám phá đấu giá
          </Link>

          <button
            type="button"
            onClick={handleSellClick}
            disabled={isCheckingSeller}
            className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded border border-white/20 bg-white/5 backdrop-blur-sm py-4 px-10 text-base font-bold text-white transition-all duration-300 hover:border-primary hover:text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-0.5"
          >
            {isCheckingSeller && <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />}
            Đăng bán tác phẩm
          </button>
        </div>

        {/* Live Trust Metrics at Hero Bottom */}
        <div
          className="animate-fade-in-up mt-16 flex items-center justify-center gap-4 sm:gap-10 border-t border-white/10 pt-8 w-full max-w-2xl px-4"
          style={{ animationDelay: "0.7s" }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xl md:text-2xl font-serif font-bold text-primary">100%</span>
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/50 mt-1">
              Gỗ Thật Kiểm Định
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-xl md:text-2xl font-serif font-bold text-primary flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              24/7
            </span>
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/50 mt-1">
              Đấu Giá Real-time
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-xl md:text-2xl font-serif font-bold text-primary">0%</span>
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/50 mt-1">
              Rủi Ro Ký Quỹ
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Cuộn xuống"
        onClick={handleScrollDown}
        className="animate-bounce-y absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex items-center justify-center rounded-full border border-white/10 bg-black/40 hover:bg-black/60 p-3 text-primary transition-all duration-300 hover:border-primary hover:shadow-[0_0_15px_rgba(214,168,79,0.25)] cursor-pointer group"
      >
        <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
      </button>
    </section>
  );
}
