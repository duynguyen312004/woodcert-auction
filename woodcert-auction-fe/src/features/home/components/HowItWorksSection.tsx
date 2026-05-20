import { Award, Gavel, Microscope, Handshake } from "lucide-react";
import { Link } from "react-router";

import { useAuthStore } from "@/shared/auth/auth-store";

const steps = [
  {
    step: 1,
    icon: Microscope,
    title: "Kiểm định",
    description:
      "Tác phẩm được các chuyên gia đầu ngành giám định chất liệu gỗ, kỹ thuật chế tác và độ tinh xảo.",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    ring: "ring-emerald-400/25",
  },
  {
    step: 2,
    icon: Award,
    title: "Ký quỹ",
    description:
      "Người tham gia thực hiện ký quỹ để đảm bảo tính nghiêm túc và bảo vệ quyền lợi đôi bên.",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    ring: "ring-primary/25",
  },
  {
    step: 3,
    icon: Gavel,
    title: "Đấu giá",
    description:
      "Tham gia đấu giá trực tiếp theo thời gian thực với hệ thống countdown chuẩn xác và bảo mật cao.",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
    ring: "ring-sky-400/25",
  },
  {
    step: 4,
    icon: Handshake,
    title: "Giao dịch",
    description:
      "Bàn giao tác phẩm kèm Chứng thư WoodCert vật lý và kỹ thuật số xác thực nguồn gốc.",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    ring: "ring-orange-400/25",
  },
];

export function HowItWorksSection() {
  const isAuthenticated = useAuthStore((s) => s.status) === "authenticated";

  return (
    <section className="relative border-t border-white/8 bg-card/20 py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-4 lg:px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Process
          </p>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-[2.75rem]">
            Sở hữu tác phẩm trong 4 bước
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Quy trình minh bạch, bảo mật tuyệt đối cho cả người mua và nghệ nhân.
          </p>
        </div>

        <div className="relative grid gap-10 md:grid-cols-4">
          <div className="absolute left-16 right-16 top-12 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:block" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="group relative z-10 flex flex-col items-center text-center"
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                <div
                  className={`relative mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-card ring-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${step.ring}`}
                >
                  <div
                    className={`absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${step.iconBg}`}
                  />
                  <Icon className={`relative h-9 w-9 ${step.iconColor}`} />
                </div>

                <h3 className="mb-2 font-serif text-lg font-bold text-foreground">
                  {step.step}. {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground px-2">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 flex justify-center">
          {isAuthenticated ? (
            <Link
              to="/auctions"
              className="inline-flex items-center gap-2.5 rounded-full bg-primary/12 px-10 py-3.5 text-sm font-semibold text-primary ring-1 ring-primary/30 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:ring-primary hover:shadow-lg hover:shadow-primary/20"
            >
              Khám phá phiên đấu giá ngay
            </Link>
          ) : (
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2.5 rounded-full bg-primary/12 px-10 py-3.5 text-sm font-semibold text-primary ring-1 ring-primary/30 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:ring-primary hover:shadow-lg hover:shadow-primary/20"
            >
              Bắt đầu ngay — Miễn phí
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
