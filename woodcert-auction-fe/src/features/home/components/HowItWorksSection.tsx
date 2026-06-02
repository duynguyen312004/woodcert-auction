import { Award, Gavel, Microscope, Handshake } from "lucide-react";
import { Link } from "react-router";

import { useAuthStore } from "@/shared/auth/auth-store";

const steps = [
  {
    step: "01",
    icon: Microscope,
    title: "Kiểm định độc quyền",
    description:
      "Tác phẩm được chuyên gia giám định nghiêm ngặt chất gỗ, tuổi đời và kỹ thuật đục khắc trước khi lên sàn.",
    iconBg:
      "bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40",
    iconColor: "text-emerald-400",
    ring: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
  },
  {
    step: "02",
    icon: Award,
    title: "Ký quỹ bảo chứng",
    description:
      "Người tham gia thực hiện ký quỹ minh bạch để bảo đảm tính nghiêm túc của phiên và quyền lợi của đôi bên.",
    iconBg:
      "bg-primary/10 border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40",
    iconColor: "text-primary",
    ring: "group-hover:shadow-[0_0_20px_rgba(214,168,79,0.15)]",
  },
  {
    step: "03",
    icon: Gavel,
    title: "Đấu giá Real-time",
    description:
      "Tham gia đấu giá trực tiếp thời gian thực với hệ thống đếm ngược chuẩn xác đến từng mili-giây.",
    iconBg:
      "bg-sky-500/10 border-sky-500/20 group-hover:bg-sky-500/20 group-hover:border-sky-500/40",
    iconColor: "text-sky-400",
    ring: "group-hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]",
  },
  {
    step: "04",
    icon: Handshake,
    title: "Bàn giao & Chứng thư",
    description:
      "Bàn giao tác phẩm tận nơi kèm Chứng thư vật lý và Chứng nhận số hoá xác thực độc quyền.",
    iconBg:
      "bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20 group-hover:border-orange-500/40",
    iconColor: "text-orange-400",
    ring: "group-hover:shadow-[0_0_20px_rgba(251,146,60,0.15)]",
  },
];

export function HowItWorksSection() {
  const isAuthenticated = useAuthStore((s) => s.status) === "authenticated";

  return (
    <section className="relative border-t border-white/5 bg-background py-24 overflow-hidden select-none">
      {/* Decorative background line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute left-1/4 bottom-0 h-[250px] w-[250px] rounded-full bg-primary/2 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-6">
        <div className="mb-20 text-center relative">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Acquisition Process
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem]">
            Sở hữu tác phẩm trong 4 bước
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm font-light leading-relaxed text-muted-foreground">
            Quy trình đấu giá và chuyển giao được thiết kế chuẩn mực, minh bạch và an toàn tuyệt đối
            cho giới sưu tầm.
          </p>
        </div>

        <div className="relative grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Connecting Line on large screens */}
          <div className="absolute left-20 right-20 top-12 hidden h-0.5 border-t border-dashed border-white/10 md:block z-[1]" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="group relative z-10 flex flex-col items-center text-center transition-all duration-300"
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                {/* Big Background Number */}
                <div className="absolute -top-12 text-7xl font-serif font-extrabold text-white/[0.02] tracking-widest select-none pointer-events-none transition-colors duration-300 group-hover:text-primary/[0.04]">
                  {step.step}
                </div>

                <div
                  className={`relative mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-[#141412] transition-all duration-500 ${step.ring} group-hover:border-primary/40`}
                >
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-500 border ${step.iconBg}`}
                  />
                  <Icon
                    className={`relative h-8 w-8 transition-transform duration-500 will-change-transform group-hover:scale-110 ${step.iconColor}`}
                  />
                </div>

                <h3 className="mb-2 font-serif text-lg font-bold text-foreground transition-colors duration-300 group-hover:text-primary">
                  {parseInt(step.step)}. {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-light px-3">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-20 flex justify-center">
          {isAuthenticated ? (
            <Link
              to="/auctions"
              className="group relative overflow-hidden inline-flex items-center gap-2.5 rounded border border-primary/40 bg-primary/5 px-10 py-3.5 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              Khám phá phiên đấu giá ngay
            </Link>
          ) : (
            <Link
              to="/auth/register"
              className="group relative overflow-hidden inline-flex items-center gap-2.5 rounded border border-primary/40 bg-primary/5 px-10 py-3.5 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              Bắt đầu ngay — Miễn phí
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
